export const OSPackage: IPackage<MemBase> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(PKG_BasicRoomActivity, BasicRoomActivity);
    }
}

import { BasicProcess } from "Core/BasicTypes";

const PKG_BasicRoomActivity_LogContext: LogContext = {
    logID: PKG_BasicRoomActivity,
    logLevel: LOG_TRACE
}

const ENABLE_PROFILING = true;
class BasicRoomActivity extends BasicProcess<RoomActivity_Memory> {
    @extensionInterface(EXT_RoomRegistry)
    RoomExtensions!: IRoomDataExtension;
    protected get logID(): string {
        return PKG_BasicRoomActivity_LogContext.logID;
    }
    protected get logLevel(): LogLevel {
        return PKG_BasicRoomActivity_LogContext.logLevel!;
    }

    private roomData!: RoomState;

    PrepThread() {
        this.roomData = this.RoomExtensions.GetRoomData(this.memory.rID)!;
        if(!this.roomData || this.roomData.activityPID != this.pid) {
            throw new Error(`Room activity couldn't find its roomData (${this.memory.rID})`);
        }
    }

    RunThread(): ThreadState {
        let start = Game.cpu.getUsed();
        try {
            this.log.info("Room activity updated");
            this.sleeper.sleep(this.pid, 5);
        } catch (ex) {
            this.log.info(`An exception occurred while trying experimental stuff (${ex})`);
        }

        if (ENABLE_PROFILING) {
            this.log.info(`Experimental CPU used (${Game.cpu.getUsed() - start})`);
        }
        return ThreadState_Done;
    }
}