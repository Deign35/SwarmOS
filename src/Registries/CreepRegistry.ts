declare var Memory: {
    creepData: CreepRegistry_Memory;
    creeps: SDictionary<CreepMemory>;
}

import { BasicProcess, ExtensionBase } from "Core/BasicTypes";

export const OSPackage: IPackage<CreepRegistry_Memory> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(PKG_CreepRegistry, CreepRegistry);
        extensionRegistry.register(EXT_CreepRegistry, new CreepRegistryExtensions(extensionRegistry));
    }
}

class CreepRegistry extends BasicProcess<CreepRegistry_Memory> {
    @extensionInterface(EXT_CreepRegistry)
    creepRegistry!: ICreepRegistryExtensions;

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

    PrepTick() {
        let creepIDs = Object.keys(this.registeredCreeps);
        for (let i = 0; i < creepIDs.length; i++) {
            // Delete dead process references
            if (!this.kernel.getProcessByPID(this.registeredCreeps[creepIDs[i]].o!)) {
                delete this.memory.registeredCreeps[creepIDs[i]].o;
            }
            // Delete dead creeps
            if (!Game.creeps[creepIDs[i]]) {
                delete this.memory.registeredCreeps[creepIDs[i]];
                delete Memory.creeps[creepIDs[i]];
            }
        }
    }

    RunThread(): ThreadState {
        let creepIDs = Object.keys(Game.creeps);
        for (let i = 0, length = creepIDs.length; i < length; i++) {
            let creep = Game.creeps[creepIDs[i]];
            let context = this.registeredCreeps[creep.name];
            if (!context) {
                if (!this.creepRegistry.tryRegisterCreep(creep.name)) {
                    this.log.error(`Creep context doesnt exist and couldnt register the creep(${creep.name}).`);
                    // (TODO): This shouldn't end the thread...
                    return ThreadState_Done;
                }
                this.registeredCreeps[creep.name].o = creep.memory.p;
                delete creep.memory.p;
                context = this.registeredCreeps[creep.name];
            }

            /*if (!context.o) {
                let roomData = this.roomView.GetRoomData(creep.room.name)!;
                if (roomData.groups.CR_Work) {
                    let proc = this.kernel.getProcessByPID(roomData.groups.CR_Work);
                    if (proc && (proc as IWorkerGroupProcess).AddCreep) {
                        (proc as IWorkerGroupProcess).AddCreep(creep.name);
                    }
                }
            }*/
        }
        return ThreadState_Done;
    }
}
class CreepRegistryExtensions extends ExtensionBase implements ICreepRegistryExtensions {
    @extensionInterface(EXT_Kernel)
    protected kernel!: IKernelExtensions;

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

    tryFindCompatibleCreep(creepType: CT_ALL, level: number, targetRoom: RoomID, maxDistance: number = 3): string | undefined {
        let bestMatch: { con: CreepContext, creep: Creep } | undefined = undefined;
        let dist = maxDistance + 1;
        let desiredBody = CreepBodies[creepType][level];
        let creepIDs = Object.keys(this.registeredCreeps);
        for (let i = 0; i < creepIDs.length; i++) {
            let creepData = this.registeredCreeps[creepIDs[i]];
            let creep = Game.creeps[creepData.c];

            if (creepData.o) {
                let parentProcess = this.kernel.getProcessByPID(creepData.o);
                if (parentProcess && (/*parentProcess.pkgName != CR_Work ||*/ creepType == CT_Worker)) {
                    continue;
                }
            }

            let compareDist = Game.map.getRoomLinearDistance(Game.creeps[creepData.c].room.name, targetRoom);
            let betterMatch = false;

            if (creep.memory.ct == creepType || creepType == CT_Worker) {
                if (!bestMatch) {
                    betterMatch = true;
                } else {
                    if (bestMatch.con.o && !creepData.o) {
                        betterMatch = true;
                        //} else if (creep.memory.ct == creepType && bestMatch.creep.memory.ct != creepType) {
                        //    betterMatch = true;
                    } else if (bestMatch.creep.memory.lvl != level || bestMatch.creep.memory.lvl == creep.memory.lvl) {
                        if (compareDist < dist) {
                            betterMatch = true;
                        } else if (bestMatch.creep.memory.lvl < level && creep.memory.lvl > bestMatch.creep.memory.lvl) {
                            betterMatch = true;
                        } else if (bestMatch.creep.memory.lvl > level && creep.memory.lvl < bestMatch.creep.memory.lvl) {
                            betterMatch = true;
                        }
                    }
                }
            }

            if (betterMatch) {
                bestMatch = {
                    con: creepData,
                    creep: creep
                }
                dist = compareDist;
            }
        }

        return bestMatch ? bestMatch.con.c : undefined;
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

    CreateNewCreepActivity(actionMem: CreepActivity_Memory, parentPID: PID): PID | undefined {
        if (!actionMem || !parentPID || !actionMem.c || !actionMem.at) {
            return undefined;
        }
        let creep = (this.extensionRegistry.get(EXT_CreepRegistry) as ICreepRegistryExtensions).tryGetCreep(actionMem.c, parentPID);
        if (!creep) {
            return undefined;
        }
        let target: ObjectTypeWithID | RoomPosition | undefined | null = actionMem.t ? Game.getObjectById(actionMem.t) : undefined;
        if (!target && actionMem.p) {
            target = new RoomPosition(actionMem.p.x || 25, actionMem.p.y || 25, actionMem.p.roomName);
        } else if (!target) {
            target = creep.pos;
        }

        if (!target) {
            return undefined;
        }

        let newPID = this.kernel.startProcess(PKG_CreepActivity, actionMem);
        this.kernel.setParent(newPID, parentPID);
        return newPID;
    }
}