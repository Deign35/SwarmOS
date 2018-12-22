export const OSPackage: IPackage<HarvesterMemory> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(CJ_Harvest, Harvester);
    }
}
import { SoloJob } from "./SoloJob";

class Harvester extends SoloJob<HarvesterMemory> {
    RunThread(): ThreadState {
        let creep = this.creepRegistry.tryGetCreep(this.memory.c, this.pid);// Game.creeps[this.memory.c!];
        if (creep && !creep.spawning && creep.ticksToLive! < 80) {
            delete this.memory.c;
            delete this.memory.a;
        }
        return super.RunThread();
    }

    protected GetNewSpawnID(): string {
        let targetRoom = Game.rooms[this.memory.rID];
        let spawnLevel = 0; // (TODO): Update this value based on if targetRoom is reserved
        if (targetRoom.energyCapacityAvailable >= CreepBodies.Harvester[2].cost) {
            spawnLevel = 2;
        } else if (targetRoom.energyCapacityAvailable >= CreepBodies.Harvester[1].cost) {
            spawnLevel = 1;
        }

        return this.spawnRegistry.requestSpawn({
            l: spawnLevel,
            c: CT_Harvester,
            n: this.memory.rID + '_H' + this.memory.src.slice(-1),
            p: this.pid
        }, this.memory.rID, Priority_Medium, 3, {
                ct: CT_Harvester,
                lvl: spawnLevel,
                p: this.pid
            });
    }
    protected CreateCustomCreepActivity(creep: Creep): string | undefined {
        let targetRoom = Game.rooms[this.memory.rID];
        if (!targetRoom) {
            let path = creep.pos.findPathTo(new RoomPosition(25, 25, this.memory.rID), {
                ignoreCreeps: true,
                ignoreRoads: true
            });
            let lastPosition = path[path.length - 1];
            if (!lastPosition) {
                throw new Error(`Remote Harvester attempted to find a path to the next room, but failed`);
            }

            return this.creepRegistry.CreateNewCreepActivity({
                at: AT_MoveToPosition,
                c: creep.name,
                p: { x: lastPosition.x, y: lastPosition.y, roomName: creep.room.name }
            }, this.pid);
        }

        let source = Game.getObjectById<Source>(this.memory.src)!;
        if(!this.memory.sup) {
            // (TODO): Find the Container or ConstructionSite and assign it now
        }
        if (source.pos.getRangeTo(creep.pos) > 1) {
            return this.creepRegistry.CreateNewCreepActivity({
                at: AT_MoveToPosition,
                c: creep.name,
                p: source.pos,
                a: 1
            }, this.pid);
        }

        if (source.energy > 0) {
            return this.creepRegistry.CreateNewCreepActivity({
                t: source.id,
                at: AT_Harvest,
                c: creep.name,
                e: [ERR_FULL]
            }, this.pid);
        }
        let container = Game.getObjectById<StructureContainer | ConstructionSite>(this.memory.sup);
        if (creep.carry.energy > 0) {
            if (container) {
                if ((container as StructureContainer).hitsMax) {
                    if (((container as StructureContainer).hits + (REPAIR_POWER * creep.getActiveBodyparts(WORK))) <= (container as StructureContainer).hitsMax) {
                        return this.creepRegistry.CreateNewCreepActivity({
                            at: AT_Repair,
                            c: creep.name,
                            t: container.id
                        }, this.pid)
                    }
                } else if ((container as ConstructionSite).progressTotal) {
                    return this.creepRegistry.CreateNewCreepActivity({
                        at: AT_Build,
                        c: creep.name,
                        t: container.id
                    }, this.pid);
                } else {
                    delete this.memory.sup;
                }
            } else {
                let sites = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES);
                if (sites && sites.length > 0) {

                } else {
                    creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                    return this.creepRegistry.CreateNewCreepActivity({
                        at: AT_Harvest,
                        c: creep.name,
                        t: source.id
                    }, this.pid);
                }
            }
        }

        return;
    }
    HandleNoActivity() {
        // Do Nothing;
    }
}