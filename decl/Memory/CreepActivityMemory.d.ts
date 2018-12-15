declare interface CreepActivityMemory extends CreepMemory {

}

declare interface HarvesterActivityMemory extends CreepMemory {
    s: ObjectID;    // (s)ourceID
    con: ObjectID;  // (con)tainerID
}