export const OSPackage: IPackage<MemBase> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(PKG_HarvesterActivity, HarvesterActivity);
    }
}

import { BasicProcess } from "Core/BasicTypes";

const PKG_HarvesterActivity_LogContext: LogContext = {
    logID: PKG_HarvesterActivity,
    logLevel: LOG_TRACE
}

const ENABLE_PROFILING = true;
class HarvesterActivity extends BasicProcess<HarvesterActivityMemory> {
    private _container?: ConstructionSite | StructureContainer;
    private _creep!: Creep;
    private _source!: Source;

    PrepTick() {
        this._creep = Game.creeps[this.memory.c];
        if(!this._creep) {
            throw new Error(`HarvesterActivity could not find associated creep (${this.memory.c})`);
        }
        this._source = Game.getObjectById(this.memory.s) as Source;
        if(!this._source || !this._source.energyCapacity) {
            throw new Error(`HarvesterActivity could not find source object (${this.memory.s})`);
        }
        this._container = Game.getObjectById(this.memory.con) as ConstructionSite | StructureContainer;
        if(!this.memory.con) {
            // Find an existing container
            let container = this._source.pos.findInRange(FIND_STRUCTURES, 1, { filter: function(struct) {
                return struct.structureType == STRUCTURE_CONTAINER;
            }});
            if(container && container.length >= 1) {
                this.memory.con = container[0].id;
            } else {
                // Find an existing construction site
                let cSite = this._source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {filter: function(site) {
                    return site.structureType == STRUCTURE_CONTAINER;
                }});
                if(cSite && cSite.length >= 1) {
                    this.memory.con = cSite[0].id;
                } else {
                    // Create a new construction site
                    let path = this._creep.pos.findPathTo(this._source);
                    let conPos = path[path.length-2];
                    this._creep.room.createConstructionSite(conPos.x, conPos.y, STRUCTURE_CONTAINER);
                }
            }
        }
    }

    RunThread(): ThreadState {
        let start = Game.cpu.getUsed();
        try {
            if(this._creep.pos.isNearTo(this._source)) {
                this._creep.harvest(this._source);
            }

            if(this._container) {
                if(!this._creep.pos.isEqualTo(this._container)) {
                    this._creep.moveTo(this._container);
                }

                if((this._container as ConstructionSite).progressTotal && this._creep.energy > 0) {
                    this._creep.build(this._container as ConstructionSite);
                }
            } else {
                this._creep.moveTo(this._source);
            }
        } catch (ex) {
            this.log.info(`An exception occurred while trying experimental stuff (${ex})`);
        }

        if (ENABLE_PROFILING) {
            this.log.info(`Experimental CPU used (${Game.cpu.getUsed() - start})`);
        }
        return ThreadState_Done;
    }
}