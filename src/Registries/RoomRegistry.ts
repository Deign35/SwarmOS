declare var Memory: {
    roomData: RoomStateMemory
}
import { ExtensionBase, BasicProcess } from "Core/BasicTypes";

export const OSPackage: IPackage<RoomStateMemory> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(PKG_RoomRegistry, RoomRegistry);
        extensionRegistry.register(EXT_RoomRegistry, new RoomExtension(extensionRegistry));
    }
}

class RoomRegistry extends BasicProcess<RoomStateMemory> {
    @extensionInterface(EXT_RoomRegistry)
    RoomExtensions!: RoomExtension;

    get logID() { return 'RoomRegistry' };
    get logLevel() { return LOG_INFO as LogLevel; }
    get memory(): RoomStateMemory {
        if (!Memory.roomData) {
            this.log.warn(`Initializing RoomManager memory`);
            Memory.roomData = {
                roomStateData: {},
            }
        }
        return Memory.roomData;
    }

    RunThread(): ThreadState {
        for (let roomID in Game.rooms) {
            let data = this.RoomExtensions.GetRoomData(roomID);
            if (!data || !data.activityPID || !this.kernel.getProcessByPID(data.activityPID)) {
                this.RoomExtensions.BootRoom(roomID, false);
            }
        }

        return ThreadState_Done;
    }
}

class RoomExtension extends ExtensionBase implements IRoomDataExtension {
    get memory(): RoomStateMemory {
        if (!Memory.roomData) {
            this.log.warn(`Initializing RoomManager memory`);
            Memory.roomData = {
                roomStateData: {},
            }
        }

        return Memory.roomData;
    }

    GetRoomData(roomID: string): RoomState | undefined {
        return this.memory.roomStateData[roomID];
    }

    BootRoom(roomID: string, force: boolean) {
        let data = this.GetRoomData(roomID);
        if (force || !data) {
            if (data && data.activityPID) {
                this.extensionRegistry.getKernel().killProcess(data.activityPID, 'Rebooting room');
                delete data.activityPID;
            }
            let room = Game.rooms[roomID];
            let roomData: RoomState = {
                activityPID: '',
                lastUpdated: 0,

                minerals: {},
                sources: {},
            }
            let mineralIDs = room.find(FIND_MINERALS)!.map((val: Mineral) => {
                return val.id;
            });
            for(let i = 0; i < mineralIDs.length; i++) {
                roomData.minerals[mineralIDs[i]] = {
                    creepJobPID: undefined
                }
            }
            let sourceIDs = room.find(FIND_SOURCES)!.map((val: Source) => {
                return val.id;
            });
            for(let i = 0; i < sourceIDs.length; i++) {
                roomData.sources[sourceIDs[i]] = {
                    creepJobPID: undefined
                }
            }

            this.memory.roomStateData[roomID] = roomData;
        }

        data = this.GetRoomData(roomID)!;
        if (!data.activityPID || !this.extensionRegistry.getKernel().getProcessByPID(data.activityPID)) {
            let room = Game.rooms[roomID];
            if(room.controller && room.controller.owner.username == MY_USERNAME) {
                let newMem: RoomActivity_Memory = {
                    rID: roomID
                }
                this.memory.roomStateData[roomID]!.activityPID = this.extensionRegistry.getKernel().startProcess(PKG_RoomActivity, newMem);
            }
        }
    }
}