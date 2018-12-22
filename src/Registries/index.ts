import { PackageProviderBase } from "Core/BasicTypes";

import { OSPackage as CreepRegistryPackage } from "Registries/CreepRegistry";
import { OSPackage as RoomRegistryPackage } from "Registries/RoomRegistry";
import { OSPackage as SpawnRegistryPackage } from "Registries/SpawnRegistry";

export const RegistriesPackage: IPackage<{}> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(PKG_SwarmManager, SwarmManager);

        CreepRegistryPackage.install(processRegistry, extensionRegistry);
        RoomRegistryPackage.install(processRegistry, extensionRegistry);
        SpawnRegistryPackage.install(processRegistry, extensionRegistry);
    },
}

class SwarmManager extends PackageProviderBase<PackageProviderMemory> {
    protected get RequiredServices(): SDictionary<ProviderService> {
        return this._reqServices;
    }
    private _reqServices: SDictionary<ProviderService> = {
        creepRegistry: {
            processName: PKG_CreepRegistry
        },
        roomRegistry: {
            processName: PKG_RoomRegistry
        },
        spawnRegistry: {
            processName: PKG_SpawnRegistry
        }
    }
}