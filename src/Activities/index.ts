import { OSPackage as CreepActivityPackage } from "Activities/CreepActivity";
import { OSPackage as SpawnActivityPackage } from "Activities/SpawnActivity";

export const ActivitiesPackage: IPackage<{}> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        CreepActivityPackage.install(processRegistry, extensionRegistry);
        SpawnActivityPackage.install(processRegistry, extensionRegistry);
    },
}