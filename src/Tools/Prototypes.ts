// @ts-ignore
if (!Flag.prototype.SwarmOS) {
    Object.defineProperties(Flag.prototype, {
        id: {
            get() {
                return this.name;
            }
        },
        SwarmOS: {
            get() {
                return true;
            }
        }
    });
}
// @ts-ignore
if (!Room.prototype.SwarmOS) {
    Object.defineProperties(Room.prototype, {
        id: {
            get() {
                return this.name;
            }
        },
        SwarmOS: {
            get() {
                return true;
            }
        }
    });
}
// @ts-ignore
if (!StructureContainer.prototype.SwarmOS) {
    Object.defineProperties(StructureContainer.prototype, {
        energy: {
            get() {
                return this.store.energy || 0;
            }
        },
        energyCapacity: {
            get() {
                return this.storeCapacity - _.sum(this.store) + this.energy;
            }
        },
        SwarmOS: {
            get() {
                return true;
            }
        }
    });
}
// @ts-ignore
if (!StructureStorage.prototype.SwarmOS) {
    Object.defineProperties(StructureStorage.prototype, {
        energy: {
            get() {
                return this.store.energy || 0;
            }
        },
        energyCapacity: {
            get() {
                return this.storeCapacity - _.sum(this.store) + this.energy;
            }
        },
        SwarmOS: {
            get() {
                return true;
            }
        }
    });
}
// @ts-ignore
if (!StructureTerminal.prototype.SwarmOS) {
    Object.defineProperties(StructureTerminal.prototype, {
        energy: {
            get() {
                return this.store.energy || 0;
            }
        },
        energyCapacity: {
            get() {
                return this.storeCapacity - _.sum(this.store) + this.energy;
            }
        },
        SwarmOS: {
            get() {
                return true;
            }
        }
    });
}
// @ts-ignore
if (!Tombstone.prototype.SwarmOS) {
    Object.defineProperties(Tombstone.prototype, {
        energy: {
            get() {
                return this.store.energy || 0;
            }
        },
        energyCapacity: {
            get() {
                return this.store.energy || 0;
            }
        },
        SwarmOS: {
            get() {
                return true;
            }
        }
    });
}
// @ts-ignore
if (!Creep.prototype.SwarmOS) {
    Object.defineProperties(Creep.prototype, {
        energy: {
            get() {
                return this.carry.energy || 0;
            }
        },
        energyCapacity: {
            get() {
                return this.carryCapacity - _.sum(this.carry) + this.energy;
            }
        },
        SwarmOS: {
            get() {
                return true;
            }
        }
    });
}