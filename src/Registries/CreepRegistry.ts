declare var Memory: {
    creepData: CreepRegistry_Memory;
    creeps: SDictionary<void>
    //creeps: SDictionary<ScreepsObject_CreepMemory>;
}
declare interface CreepRegistry_Memory extends MemBase {
    registeredCreeps: { [id in CreepID]: CreepContext };
}
declare interface CreepContext extends MemBase {
    o?: PID;        // (o)wner process
    c: CreepID;     // (c)reep name
    rID: RoomID;    // spawn room
}

import { BasicProcess, ExtensionBase } from "Core/BasicTypes";

export const OSPackage: IPackage<CreepRegistry_Memory> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(PKG_CreepRegistry, CreepRegistry);
        extensionRegistry.register(EXT_CreepRegistry, new CreepRegistryExtensions(extensionRegistry));
        //extensionRegistry.register(EXT_CreepActivity, new CreepActivityExtensions(extensionRegistry));
    }
}

const PKG_CreepRegistry_LogContext: LogContext = {
    logID: PKG_CreepRegistry,
    logLevel: LOG_INFO
}

// This order determines the default order of body parts
const BodyLegend = {
    t: TOUGH,
    a: ATTACK,
    r: RANGED_ATTACK,
    cl: CLAIM,
    w: WORK,
    c: CARRY,
    h: HEAL,
    m: MOVE,
}

// This can eventually become a CreepGroup, but one that controls all the creeps -- Scheduler!!!!
class CreepRegistry extends BasicProcess<CreepRegistry_Memory> {
    @extensionInterface(EXT_CreepRegistry)
    Extensions!: ICreepRegistryExtensions;
    /*@extensionInterface(EXT_RoomView)
    View!: IRoomDataExtension;*/
    get memory(): CreepRegistry_Memory {
        if (!Memory.creepData) {
            this.log.warn(`Initializing CreepRegistry memory`);
            Memory.creepData = {
                registeredCreeps: {}
            }
        }
        return Memory.creepData;
    }
    protected get registeredCreeps() {
        return this.memory.registeredCreeps;
    }

    protected get logID(): string {
        return PKG_CreepRegistry_LogContext.logID;
    }
    protected get logLevel(): LogLevel {
        return PKG_CreepRegistry_LogContext.logLevel!;
    }

    PrepTick() {
        // Check each registered creep
        let creepIDs = Object.keys(this.registeredCreeps);
        for (let i = 0; i < creepIDs.length; i++) {
            // Check if the owning process is still running
            if (!this.kernel.getProcessByPID(this.registeredCreeps[creepIDs[i]].o!)) {
                delete this.memory.registeredCreeps[creepIDs[i]].o;
            }

            // Check if the creep is still alive
            if (!Game.creeps[creepIDs[i]]) {
                // (TODO): Callback to the owning process before delete
                delete this.memory.registeredCreeps[creepIDs[i]];
                delete Memory.creeps[creepIDs[i]];
            }
        }
    }

    RunThread(): ThreadState {
        // Run all existing creeps
        let creepIDs = Object.keys(Game.creeps);
        for (let i = 0, length = creepIDs.length; i < length; i++) {
            let creep = Game.creeps[creepIDs[i]];
            let context = this.registeredCreeps[creep.name];
            if (!context) {
                if (!this.Extensions.tryRegisterCreep(creep.name)) {
                    this.log.error(`Creep context doesnt exist and couldnt register the creep(${creep.name}).`);
                    return ThreadState_Done;
                }
                this.registeredCreeps[creep.name].o = creep.memory.p;
                delete creep.memory.p;
                context = this.registeredCreeps[creep.name];
            }

            if (!context.o) {
                /*let roomData = this.View.GetRoomData(creep.room.name)!;
                if (roomData.groups.CR_Work) {
                    let proc = this.kernel.getProcessByPID(roomData.groups.CR_Work);
                    if (proc && (proc as IWorkerGroupProcess).AddCreep) {
                        (proc as IWorkerGroupProcess).AddCreep(creep.name);
                    }
                }*/
            }
        }
        return ThreadState_Done;
    }
}

class CreepRegistryExtensions extends ExtensionBase implements ICreepRegistryExtensions {
    get memory(): CreepRegistry_Memory {
        if (!Memory.creepData) {
            this.log.warn(`Initializing CreepRegistry memory`);
            Memory.creepData = {
                registeredCreeps: {}
            }
        }
        return Memory.creepData;
    }
    protected get registeredCreeps() {
        return this.memory.registeredCreeps;
    }
    tryRegisterCreep(creepID: CreepID): boolean {
        if (!this.registeredCreeps[creepID] && Game.creeps[creepID]) {
            this.registeredCreeps[creepID] = {
                c: creepID,
                rID: Game.creeps[creepID].room.name
            }
            return true;
        }

        return false;
    }

    tryGetCreep(id?: CreepID, requestingPID?: PID): Creep | undefined {
        if (!id || !requestingPID) {
            return undefined;;
        }
        let request = this.registeredCreeps[id];
        if (!request || !Game.creeps[request.c] || !request.o || request.o != requestingPID) {
            return undefined;
        }
        return Game.creeps[request.c];
    }

    tryReserveCreep(id?: CreepID, requestingPID?: PID): boolean {
        if (!id || !requestingPID) {
            return false;
        }
        if (!this.registeredCreeps[id]) {
            if (!this.tryRegisterCreep(id)) {
                return false;
            }
        }
        if (!this.registeredCreeps[id].o) {
            this.registeredCreeps[id].o = requestingPID;
        }
        return this.registeredCreeps[id].o == requestingPID;
    }

    releaseCreep(id?: CreepID, requestingPID?: PID): void {
        if (!id) {
            return;
        }
        if (this.registeredCreeps[id]) {
            if (!requestingPID || this.registeredCreeps[id].o == requestingPID) {
                this.registeredCreeps[id].o = undefined;
            }
        }
    }
}