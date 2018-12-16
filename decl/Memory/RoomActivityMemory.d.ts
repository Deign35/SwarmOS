declare interface RoomStateMemory extends MemBase {
    roomStateData: SDictionary<RoomState>
}
declare interface RoomState extends MemBase {
    lastUpdated: number;
    lastEnergy: number;

    cSites: ObjectID[];
    mineralIDs: ObjectID[];
    resources: ObjectID[];
    sourceIDs: ObjectID[];
    tombstones: ObjectID[];
    needsRepair: ObjectID[];
    minUpdateOffset: number;
    structures: SDictionary<StructureConstant>
    activityPID: PID;
    owner?: PlayerID;
}
declare interface RoomActivity_Memory extends MemBase {
    rID: RoomID;
}