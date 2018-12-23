export const OSPackage: IPackage<MemBase> = {
    install(processRegistry: IProcessRegistry, extensionRegistry: IExtensionRegistry) {
        processRegistry.register(PKG_CreepActivity, CreepActivity);
    }
}

import { BasicProcess } from "Core/BasicTypes";

interface RunArgs {
    creep: Creep;
    actionType: ActionType;

    target?: any;
    amount?: number;
    message?: string;
    resourceType?: ResourceConstant;
}

class CreepActivity extends BasicProcess<CreepActivity_Memory> {
    @extensionInterface(EXT_CreepRegistry)
    creepRegistry!: ICreepRegistryExtensions;

    AssignedCreep?: Creep;
    Target?: ObjectTypeWithID;
    TargetPos?: RoomPosition;

    PrepTick() {
        this.AssignedCreep = this.creepRegistry.tryGetCreep(this.memory.c, this.parentPID);
        this.Target = Game.getObjectById(this.memory.t) as ObjectTypeWithID;
        if (this.memory.p) {
            this.TargetPos = new RoomPosition(this.memory.p.x || 25, this.memory.p.y || 25, this.memory.p.roomName);
        }
    }
    RunThread(): ThreadState {
        if (!this.AssignedCreep || (!this.Target && !this.TargetPos) || !this.ValidateActionTarget(this.memory.at, this.Target || this.TargetPos)) {
            this.EndActivity();
            return ThreadState_Done;
        }
        if(this.AssignedCreep.spawning) {
            return ThreadState_Done;
        }

        let activityArgs = {
            actionType: this.memory.at,
            creep: this.AssignedCreep!,
            target: this.Target || this.TargetPos || this.AssignedCreep!.pos,
            amount: this.memory.a,
            message: this.memory.m,
            resourceType: this.memory.r,
        }

        if (this.memory.at == AT_MoveToPosition) {
            let result = this.RunActivity(activityArgs);
            if (result == ERR_NOT_IN_RANGE || result == ERR_BUSY || result == ERR_TIRED) {
                // Not yet there
            } else if (result == OK) {
                this.EndActivity();
            } else if (result == ERR_NO_PATH) {
                let hasCreep = this.TargetPos!.lookFor(LOOK_CREEPS);
                if (hasCreep && hasCreep.length > 0 && hasCreep[0].name != this.AssignedCreep.name) {
                    let otherCreep = hasCreep[0];
                    this.MoveCreep(otherCreep, this.AssignedCreep.pos);
                } else {
                    this.EndActivity();
                }
            }
            return ThreadState_Done;
        }

        if (!this.CreepIsInRange(this.memory.at, this.AssignedCreep.pos, this.TargetPos || this.Target!.pos)) {
            if (this.MoveCreep(this.AssignedCreep, this.TargetPos || this.Target!.pos) == ERR_NO_PATH) {
                this.EndActivity();
            }
        } else {
            let result = this.RunActivity(activityArgs);
            switch (this.memory.at) {
                case (AT_ClaimController):
                case (AT_Drop):
                case (AT_GenerateSafeMode):
                case (AT_Pickup):
                case (AT_RequestTransfer):
                case (AT_SignController):
                case (AT_Suicide):
                case (AT_Transfer):
                case (AT_Withdraw):
                case (AT_NoOp):
                    this.EndActivity();
                    return ThreadState_Done;
                default:
                    break;
            }
            if (result == OK || result == ERR_BUSY || result == ERR_TIRED) {
                return ThreadState_Done;
            }
            if (this.memory.e) {
                for (let i = 0; i < this.memory.e.length; i++) {
                    if (result == this.memory.e[i]) {
                        return ThreadState_Done;
                    }
                }
            }
            // If we get here, then the action result is not accessible.
            this.EndActivity();
        }

        return ThreadState_Done;
    }

    EndActivity() {
        if (!this.memory.HC) {
            this.EndProcess();
            return;
        }
        let parent = this.GetParentProcess();
        if (parent && parent[this.memory.HC]) {
            parent[this.memory.HC](this.memory.c);
        }

        //(TODO): Change this to put the activity to sleep so as not to waste creating and destroying over and over
        // let the parent decide to destroy or not
        this.EndProcess();
    }

    protected GetSquareDistance(pos1: { x: number, y: number }, pos2: { x: number, y: number }) {
        let xDiff = pos1.x - pos2.x;
        xDiff *= xDiff < 0 ? -1 : 1;
        let yDiff = pos1.y - pos2.y;
        yDiff *= yDiff < 0 ? -1 : 1;
        return xDiff > yDiff ? xDiff : yDiff;
    }

    protected MoveCreep(creep: Creep, pos: RoomPosition, moveToOpts: MoveToOpts = {}) {
        if (!moveToOpts.visualizePathStyle) {
            moveToOpts.visualizePathStyle = {
                fill: 'transparent',
                stroke: '#fff',
                lineStyle: 'dashed',
                strokeWidth: .15,
                opacity: .25
            }
        }

        // (TODO): Verify this does anything...
        moveToOpts.noPathFinding = true;
        let err = creep.moveTo(pos, moveToOpts);
        if (err = ERR_NO_PATH) {
            moveToOpts.noPathFinding = false;
            err = creep.moveTo(pos, moveToOpts);
        }
        return err;
    }

    protected CreepIsInRange(actionType: ActionType, pos1: RoomPosition, pos2: RoomPosition) {
        let distance = this.GetSquareDistance(pos1, pos2);
        if (actionType == AT_Build || actionType == AT_RangedAttack || actionType == AT_RangedHeal || actionType == AT_Repair || actionType == AT_Upgrade) {
            return distance <= 3;
        } else if (actionType == AT_Drop || actionType == AT_Suicide) {
            return distance == 0;
        } else {
            return distance <= 1;
        }
    }

    protected RunActivity(args: RunArgs) {
        let creep = args.creep;
        let actionType = args.actionType;
        let target = args.target;
        switch (actionType) {
            case (AT_Attack): return creep.attack(target);
            case (AT_AttackController): return creep.attackController(target);
            case (AT_Build): return creep.build(target);
            case (AT_ClaimController): return creep.claimController(target);
            case (AT_Dismantle): return creep.dismantle(target);
            case (AT_GenerateSafeMode): return creep.generateSafeMode(target);
            case (AT_Harvest):
                let res = creep.harvest(target);
                if (res == OK && creep.carry.energy == creep.carryCapacity) {
                    return ERR_FULL;
                }
                return res;
            case (AT_Heal): return creep.heal(target);
            case (AT_Pickup): return creep.pickup(target);
            case (AT_RangedAttack): return creep.rangedAttack(target);
            case (AT_RangedHeal): return creep.rangedHeal(target);
            case (AT_Repair):
                if ((target as Structure).hits == (target as Structure).hitsMax) {
                    return ERR_INVALID_TARGET;
                }
                return creep.repair(target);
            case (AT_ReserveController): return creep.reserveController(target);
            case (AT_Upgrade): return creep.upgradeController(target);
            case (AT_RequestTransfer):
                if ((target as Creep).transfer) {
                    return (target as Creep).transfer(creep, args.resourceType || RESOURCE_ENERGY, args.amount || 0);
                }
                break;
            case (AT_SignController): return creep.signController(target, args.message || '');
            case (AT_Transfer): return creep.transfer(target, args.resourceType || RESOURCE_ENERGY, args.amount || 0);
            case (AT_Withdraw): return creep.withdraw(target, args.resourceType || RESOURCE_ENERGY, args.amount || 0);

            case (AT_Drop): return creep.drop(args.resourceType || RESOURCE_ENERGY, args.amount || 0);
            case (AT_MoveByPath):
                break;
            case (AT_MoveToPosition):
                if ((target as Structure).pos) {
                    target = (target as Structure).pos;
                }
                let result = creep.moveTo(target, {
                    visualizePathStyle: {
                        fill: 'transparent',
                        stroke: '#fff',
                        lineStyle: 'dashed',
                        strokeWidth: .15,
                        opacity: .25
                    }
                });

                let dist = creep.pos.getRangeTo(target);
                if (dist <= (args.amount || 0)) {
                    if (creep.pos.isNearTo(target)) {
                        let creeps = (target as RoomPosition).lookFor(LOOK_CREEPS);
                        if (creeps.length > 0 && creeps[0].name != creep.name) {
                            return ERR_NO_PATH;
                        }
                        return result;
                    }
                } else {
                    if ((target as RoomPosition).roomName == creep.room.name) {
                        let objsAtPos = (target as RoomPosition).look();
                        for (let i = 0; i < objsAtPos.length; i++) {
                            if (OBSTACLE_OBJECT_TYPES[objsAtPos[i].type] || ((objsAtPos[i].terrain || '') == 'wall')) {
                                return ERR_NO_PATH;
                            }
                        }
                    }
                    return result == OK ? ERR_NOT_IN_RANGE : result;
                }
            case (AT_RangedMassAttack): return creep.rangedMassAttack();
            case (AT_Suicide): return creep.suicide();
            case (AT_NoOp): return OK;
        }

        return ERR_INVALID_ARGS;
    }

    protected ValidateActionTarget(actionType: ActionType, target: any) {
        switch (actionType) {
            case (AT_Attack): return !!(target as Creep | Structure).hitsMax;
            case (AT_AttackController): return (target as Structure).structureType == STRUCTURE_CONTROLLER;
            case (AT_Build): return (target as ConstructionSite).structureType && !(target as Structure).hitsMax;
            case (AT_ClaimController): return (target as Structure).structureType == STRUCTURE_CONTROLLER;
            case (AT_Dismantle): return (target as Structure).structureType && !!(target as Structure).hitsMax;
            case (AT_GenerateSafeMode): return (target as Structure).structureType == STRUCTURE_CONTROLLER;
            case (AT_Harvest): return !(target as Structure).structureType && (!!(target as Source).energyCapacity || !!(target as Mineral).mineralType);
            case (AT_Heal): return !!(target as Creep).ticksToLive;
            case (AT_Pickup): return !!(target as Resource).resourceType;
            case (AT_RangedAttack): return !!(target as Creep | Structure).hitsMax
            case (AT_RangedHeal): return !!(target as Creep | Structure).hitsMax
            case (AT_Repair): return (target as Structure).structureType && !!(target as Structure).hitsMax && (target as Structure).hits < (target as Structure).hitsMax;
            case (AT_RequestTransfer): return !!(target as Creep).ticksToLive;
            case (AT_ReserveController): return (target as Structure).structureType == STRUCTURE_CONTROLLER;
            case (AT_Upgrade): return (target as Structure).structureType == STRUCTURE_CONTROLLER;
            case (AT_SignController): return (target as Structure).structureType == STRUCTURE_CONTROLLER;
            case (AT_Transfer):
                if (!(target as Creep | Structure).hitsMax) {
                    return false;
                }

                if ((target as Structure).structureType) {
                    if ((target as StructureStorage).energy < (target as StructureTerminal).energyCapacity) {
                        return true;
                    }
                } else {
                    if ((target as Creep).carry.energy < (target as Creep).carryCapacity * 0.8) {
                        return true;
                    }
                }
                return false;
            case (AT_Withdraw): return (target as Structure).structureType && (!!(target as StructureContainer).storeCapacity || !!(target as StructureLink).energyCapacity);

            case (AT_Drop):
            case (AT_MoveByPath):
            case (AT_MoveToPosition):
            case (AT_RangedMassAttack):
            case (AT_Suicide):
            case (AT_NoOp):
            default:
                return target && !!(target as RoomPosition).isNearTo;
        }
    }
}