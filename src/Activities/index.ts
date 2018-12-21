import { OSPackage as CreepActivityPackage } from "Activities/CreepActivity";
import { OSPackage as RoomActivityPackage } from "Activities/RoomActivity";
import { OSPackage as SpawnActivityPackage } from "Activities/SpawnActivity";

export const ActivitiesPackage: IPackage<{}> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        CreepActivityPackage.install(processRegistry, extensionRegistry);
        RoomActivityPackage.install(processRegistry, extensionRegistry);
        SpawnActivityPackage.install(processRegistry, extensionRegistry);
    },
}