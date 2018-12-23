import { OSPackage as HarvesterJobPackage } from "CreepJobs/HarvesterJob";

export const CreepJobsPackage: IPackage<{}> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        HarvesterJobPackage.install(processRegistry, extensionRegistry);
    },
}