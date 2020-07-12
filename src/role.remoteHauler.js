/*
 * Copyright (c) 2020.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

/**
 * Created by Bob on 7/12/2017.
 */

module.exports.role = function (creep) {
    if (creep.renewalCheck()) return;
    creep.say(ICONS.haul2, true);
    //Invader detection
    if (creep.fleeHome()) return;
    // Check if empty
    if (!_.sum(creep.store)) {
        creep.memory.storageDestination = undefined;
        creep.memory.hauling = undefined;
    }
    if (creep.memory.hauling) {
        // Perform opportunistic road repair
        creep.repairRoad();
        if (creep.pos.roomName === creep.memory.overlord) {
            // If carrying minerals deposit in terminal or storage
            if (_.sum(creep.store) > creep.store[RESOURCE_ENERGY]) creep.memory.storageDestination = creep.room.terminal.id || creep.room.storage.id;
            if (creep.memory.storageDestination) {
                let storageItem = Game.getObjectById(creep.memory.storageDestination);
                for (const resourceType in creep.store) {
                    switch (creep.transfer(storageItem, resourceType)) {
                        case OK:
                            if (!_.sum(creep.store) && (storageItem.structureType !== STRUCTURE_LINK || creep.memory.waitLink)) {
                                creep.memory.waitLink = undefined;
                            } else if (storageItem.structureType === STRUCTURE_LINK && _.sum(creep.store)) {
                                creep.memory.waitLink = true;
                                creep.idleFor(storageItem.cooldown + 1 || 5);
                            }
                            creep.memory.storageDestination = undefined;
                            break;
                        case ERR_NOT_IN_RANGE:
                            creep.shibMove(storageItem);
                            break;
                        case ERR_FULL:
                            if (storageItem.structureType !== STRUCTURE_LINK || creep.memory.waitLink) {
                                creep.memory.storageDestination = undefined;
                                creep.memory.waitLink = undefined;
                            } else {
                                creep.memory.waitLink = true;
                                creep.idleFor(5);
                            }
                            break;
                    }
                }
            } else {
                dropOff(creep)
            }
        } else {
            creep.shibMove(new RoomPosition(25, 25, creep.memory.overlord), {range: 23});
        }
    } else {
        // Handle Moving
        if (creep.room.name !== creep.memory.destination) return creep.shibMove(new RoomPosition(25, 25, creep.memory.destination), {range: 23});
        // Check if ready to haul
        if (!creep.memory.hauling && (creep.isFull || (creep.memory.overlord === creep.pos.roomName && _.sum(creep.store)))) return creep.memory.hauling = true;
        // handle safe SK movement
        let lair = creep.pos.findInRange(creep.room.structures, 5, {filter: (s) => s.structureType === STRUCTURE_KEEPER_LAIR})[0];
        let SK = creep.pos.findInRange(creep.room.creeps, 5, {filter: (c) => c.owner.username === 'Source Keeper'})[0];
        if (SK) return creep.shibKite(8); else if (lair && lair.ticksToSpawn <= 15) return creep.flee(lair, 8);
        // Handle invader cores in sk
        if (lair && _.filter(creep.room.structures, (s) => s.structureType === STRUCTURE_INVADER_CORE)[0]) {
            creep.room.cacheRoomIntel(true);
            return creep.memory.recycle = true;
        }
        if (!creep.memory.energyDestination) findResources(creep);
        if (creep.memory.energyDestination) {
            let energy = Game.getObjectById(creep.memory.energyDestination);
            let amount = creep.store.getCapacity() - _.sum(creep.store);
            if (energy && creep.getActiveBodyparts(MOVE) < creep.getActiveBodyparts(CARRY) && !energy.pos.findInRange(energy.room.structures, 4, {filter: (s) => s.structureType === STRUCTURE_ROAD}).length) amount = (creep.store.getCapacity() / 2) - _.sum(creep.store);
            return creep.withdrawResource(energy, amount);
        } else {
            creep.idleFor(10);
        }
    }
};

findResources = function (creep) {
    // Container
    let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s) => s.structureType === STRUCTURE_CONTAINER
            && s.store[RESOURCE_ENERGY] >= (creep.room.creeps.filter((c) => c.my && c.memory.energyDestination === s.id && c.id !== creep.id).length + 1) * creep.store.getFreeCapacity() * 0.7
    });
    if (container) {
        creep.memory.energyDestination = container.id;
        return true;
    }
    let droppedResource = creep.pos.findClosestByRange(creep.room.droppedResources);
    if (droppedResource) {
        creep.memory.energyDestination = droppedResource.id;
        return true;
    }
    // Tombstone
    let tombstone = creep.pos.findClosestByRange(creep.room.tombstones, {filter: (r) => r.store[RESOURCE_ENERGY] >= (creep.room.creeps.filter((c) => c.my && c.memory.energyDestination === r.id && c.id !== creep.id).length + 1) * creep.store.getFreeCapacity() * 0.5});
    if (tombstone) {
        creep.memory.energyDestination = tombstone.id;
        return true;
    }
    return false;
};

// Remote Hauler Drop Off
function dropOff(creep) {
    buildLinks(creep);
    //Close Link
    if (!creep.memory.linkSearch) {
        let closestLink = creep.pos.findClosestByRange(creep.room.structures, {
            filter: (s) => s.structureType === STRUCTURE_LINK && s.id !== s.room.memory.hubLink && s.isActive() && s.pos.getRangeTo(s.pos.findClosestByRange(Game.map.findExit(s.room.name, creep.memory.destination))) < 5
        });
        creep.memory.linkSearch = true;
        if (closestLink) creep.memory.borderLink = closestLink.id;
    }
    // Lab
    let lab = creep.pos.findClosestByRange(creep.room.structures, {
        filter: (s) => s.structureType === STRUCTURE_LAB && s.energy < s.energyCapacity && !_.filter(creep.room.creeps, (c) => c.my && c.memory.storageDestination === s.id).length && s.isActive()
    });
    if (lab) {
        creep.memory.storageDestination = lab.id;
        return true;
    }
    //Tower
    let towerCutoff = 0.65;
    if (Memory.roomCache[creep.room.name].threatLevel) towerCutoff = 0.99;
    let tower = creep.pos.findClosestByRange(creep.room.structures, {
        filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity * towerCutoff
    });
    if (tower) {
        creep.memory.storageDestination = tower.id;
        return true;
    }
    if (creep.memory.borderLink) {
        creep.memory.storageDestination = creep.memory.borderLink;
        return true;
    }
    // Terminal
    if (creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY] < TERMINAL_ENERGY_BUFFER * 0.5) {
        creep.memory.storageDestination = creep.room.terminal.id;
        return true;
    }
    //Storage baseline
    if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] < ENERGY_AMOUNT * 0.20) {
        creep.memory.storageDestination = creep.room.storage.id;
        return true;
    }
    //Controller
    let controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer);
    if (controllerContainer && _.sum(controllerContainer.store) < controllerContainer.store.getCapacity() &&
        ((!creep.room.controllerLink && Math.random() > _.sum(controllerContainer.store) / controllerContainer.store.getCapacity()) || (creep.room.controllerLink && Math.random() > (_.sum(controllerContainer.store) / controllerContainer.store.getCapacity()) * 0.5))) {
        creep.memory.storageDestination = controllerContainer.id;
        return true;
    }
    // Terminal
    if (creep.room.terminal && creep.room.terminal.store.getFreeCapacity()) {
        creep.memory.storageDestination = creep.room.terminal.id;
        return true;
    }
    // Storage
    if (creep.room.storage) {
        creep.memory.storageDestination = creep.room.storage.id;
        return true;
    }
    // Else fill spawns/extensions
    if (creep.haulerDelivery()) {
        return true;
    } else creep.idleFor(5);
}

// Build remote links
function buildLinks(creep) {
    if (creep.memory.linkAttempt || creep.pos.getRangeTo(creep.pos.findClosestByRange(FIND_EXIT)) > 3) return;
    if (creep.room.controller.level >= 8) {
        let controllerLink = Game.getObjectById(creep.room.memory.controllerLink);
        let hubLink = Game.getObjectById(creep.room.memory.hubLink);
        let allLinks = _.filter(creep.room.structures, (s) => s.my && s.structureType === STRUCTURE_LINK);
        let closestLink = creep.pos.findClosestByRange(allLinks);
        let inBuildLink = _.filter(creep.room.constructionSites, (s) => s.my && s.structureType === STRUCTURE_LINK)[0];
        if (!inBuildLink && controllerLink && hubLink && allLinks.length < 6 && creep.pos.getRangeTo(closestLink) > 10) {
            let hub = new RoomPosition(creep.room.memory.bunkerHub.x, creep.room.memory.bunkerHub.y, creep.room.name);
            if (creep.pos.getRangeTo(hub) >= 18) {
                let buildPos = new RoomPosition(creep.pos.x + getRandomInt(-2, 2), creep.pos.y + getRandomInt(-2, 2), creep.room.name);
                buildPos.createConstructionSite(STRUCTURE_LINK);
            }
        }
    }
    creep.memory.linkAttempt = true;
}
