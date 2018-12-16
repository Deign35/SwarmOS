import { OSPackage as BasicRoomActivityPackage } from "RoomActivity/BasicRoomActivity";

export const RoomActivityPackage: IPackage<{}> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        BasicRoomActivityPackage.install(processRegistry, extensionRegistry);
    },
}