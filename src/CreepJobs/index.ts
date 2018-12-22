import { OSPackage as HarvesterJobPackage } from "CreepJobs/Harvester";

export const CreepJobsPackage: IPackage<{}> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        HarvesterJobPackage.install(processRegistry, extensionRegistry);
    },
}