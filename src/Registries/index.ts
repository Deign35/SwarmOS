import { PackageProviderBase } from "Core/BasicTypes";
class SwarmManager extends PackageProviderBase<PackageProviderMemory> {
    protected get RequiredServices(): SDictionary<ProviderService> {
        return this._reqServices;
    }
    private _reqServices: SDictionary<ProviderService> = {
        /*roomManager: {
            processName: PKG_RoomManager
        },
        spawnManager: {
            processName: PKG_SpawnRegistry
        },
        flagManager: {
            processName: PKG_FlagManager
        },
        creepManager: {
            processName: PKG_CreepRegistry
        },

        cli: {
            processName: PKG_SwarmCLI
        },*/
    }
}

export const RegistriesPackage: IPackage<{}> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(PKG_SwarmManager, SwarmManager);
    },
}