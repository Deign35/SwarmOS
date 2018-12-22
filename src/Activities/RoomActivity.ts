export const OSPackage: IPackage<MemBase> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(PKG_RoomActivity, BasicRoomActivity);
    }
}

import { BasicProcess } from "Core/BasicTypes";

const PKG_RoomActivity_LogContext: LogContext = {
    logID: PKG_RoomActivity,
    logLevel: LOG_WARN
}

const ENABLE_PROFILING = true;
class BasicRoomActivity extends BasicProcess<RoomActivity_Memory> {
    @extensionInterface(EXT_RoomRegistry)
    RoomExtensions!: IRoomDataExtension;

    protected get logID(): string {
        return PKG_RoomActivity_LogContext.logID;
    }
    protected get logLevel(): LogLevel {
        return PKG_RoomActivity_LogContext.logLevel!;
    }

    protected room!: Room;
    protected roomData!: RoomState;

    PrepTick() {
        this.room = Game.rooms[this.memory.rID];
        this.roomData = this.RoomExtensions.GetRoomData(this.memory.rID)!;
        if(!this.roomData || this.roomData.activityPID != this.pid) {
            throw new Error(`Room activity couldn't find its roomData (${this.memory.rID})`);
        }
    }

    RunThread(): ThreadState {
        let start = Game.cpu.getUsed();
        try {
            this.log.info("Room activity updated");
            if(this.roomData.lastUpdated % 31) {
                // Update a thing
                for(let id in this.roomData.sources) {
                    let sourceData = this.roomData.sources[id];
                    let pid = sourceData.creepJobPID;
                    if(!pid || !this.kernel.getProcessByPID(pid)) {
                        // Create a harvester
                        let newMem: HarvesterMemory = {
                            rID: this.room.name,
                            tr: this.room.name,
                            src: id,
                        }
                        sourceData.creepJobPID = this.kernel.startProcess(CJ_Harvest, newMem);
                    }
                }
            }
            if(this.roomData.lastUpdated % 37) {
                // Update a different thing
            }

            this.roomData.lastUpdated = Game.time;
        } catch (ex) {
            this.log.info(`An exception occurred while trying experimental stuff (${ex})`);
        }

        if (ENABLE_PROFILING) {
            this.log.info(`Experimental CPU used (${Game.cpu.getUsed() - start})`);
        }
        return ThreadState_Done;
    }
}