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
    private _creep?: Creep;
    PrepTick() {
        this._creep = Game.creeps[this.memory.c];
    }

    RunThread(): ThreadState {
        let start = Game.cpu.getUsed();
        try {
            if(!this._creep) {
                this.EndProcess();
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