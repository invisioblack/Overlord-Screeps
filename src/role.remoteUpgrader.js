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
    if (creep.tryToBoost(['upgrade'])) return;
    //INITIAL CHECKS
    // Travel
    if (creep.room.name !== creep.memory.destination) return creep.shibMove(new RoomPosition(25, 25, creep.memory.destination), {range: 15});
    let link = Game.getObjectById(creep.room.memory.controllerLink);
    let container = Game.getObjectById(creep.room.memory.controllerContainer);
    let terminal = creep.room.terminal;
    if (!creep.store[RESOURCE_ENERGY]) creep.memory.working = undefined;
    if (creep.isFull) creep.memory.working = true;
    if (creep.memory.working === true) {
        if (creep.upgradeController(Game.rooms[creep.memory.destination].controller) === ERR_NOT_IN_RANGE) creep.shibMove(Game.rooms[creep.memory.destination].controller, {range: 3});
        if (container && creep.pos.getRangeTo(container) <= 1 && container.store[RESOURCE_ENERGY] > 0) creep.withdraw(container, RESOURCE_ENERGY);
        if (terminal && creep.pos.getRangeTo(terminal) <= 1 && terminal.store[RESOURCE_ENERGY] > 0) creep.withdraw(terminal, RESOURCE_ENERGY);
        if (link && creep.pos.getRangeTo(link) <= 1 && link.energy > 0) creep.withdraw(link, RESOURCE_ENERGY);
    } else {
        if (creep.memory.energyDestination) {
            creep.withdrawResource();
        } else if (container && container.store[RESOURCE_ENERGY] > 0) {
            switch (creep.withdraw(container, RESOURCE_ENERGY)) {
                case OK:
                    break;
                case ERR_NOT_IN_RANGE:
                    creep.shibMove(container);
            }
        } else {
            if (!container) {
                let container = creep.pos.findClosestByRange(creep.room.structures, {filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.pos.getRangeTo(s.room.controller) <= 1});
                if (container) creep.room.memory.controllerContainer = container.id;
            }
            if (!creep.locateEnergy(25)) {
                let source = creep.pos.getClosestSource();
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) creep.shibMove(source)
            } else {
                creep.idleFor(5);
            }
        }
    }
};