declare interface RoomStateMemory extends MemBase {
    roomStateData: SDictionary<RoomState>
}
declare interface RoomActivity_CJ { [id: string]: {
    creepJobPID: PID | undefined;
}}
declare interface RoomState extends MemBase {
    activityPID: PID;
    lastUpdated: number;

    minerals: RoomActivity_CJ
    sources: RoomActivity_CJ
}
declare interface RoomActivity_Memory extends MemBase {
    rID: RoomID;
}