declare interface SoloJob_Memory extends MemBase {
    a?: PID;        // (a)ctivity
    c?: CreepID;    // (c)reep
    exp?: boolean;  // (exp)pires -- Kill the process when the creep dies
    rID: RoomID;    // (h)ome room
    tr: RoomID;     // (t)arget (r)oom
}
declare interface HarvesterMemory extends SoloJob_Memory {
    src: ObjectID;
    sup: ObjectID;
}