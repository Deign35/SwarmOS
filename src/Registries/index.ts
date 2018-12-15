import { PackageProviderBase } from "Core/BasicTypes";
import { OSPackage as CreepRegistryPackage } from "Registries/CreepRegistry";

class SwarmManager extends PackageProviderBase<PackageProviderMemory> {
    protected get RequiredServices(): SDictionary<ProviderService> {
        return this._reqServices;
    }
    private _reqServices: SDictionary<ProviderService> = {
        creepManager: {
            processName: PKG_CreepRegistry
        },
    }
}

export const RegistriesPackage: IPackage<{}> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(PKG_SwarmManager, SwarmManager);

        CreepRegistryPackage.install(processRegistry, extensionRegistry);
    },
}