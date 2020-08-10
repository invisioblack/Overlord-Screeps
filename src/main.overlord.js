/*
 * Copyright (c) 2020.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

let observers = require('module.observerController');
let factory = require('module.factoryController');
let defense = require('military.defense');
let links = require('module.linkController');
let terminals = require('module.terminalController');
let spawning = require('module.creepSpawning');
let state = require('module.roomState');
let planner = require('module.roomPlanner');
let diplomacy = require('module.diplomacy');
let storedLevel = {};

module.exports.overlordMind = function (room, CPULimit) {
    if (!room) return;
    let mindStart = Game.cpu.getUsed();
    let cpuBucket = Game.cpu.bucket;

    // Handle auto spawn placement
    if (Memory.myRooms.length === 1 && !_.filter(Game.structures, (s) => s.structureType === STRUCTURE_SPAWN)[0]) {
        planner.buildRoom(room);
    }

    // Get income
    if (!ROOM_ENERGY_PER_TICK[room.name] || Game.time % 5 === 0) {
        let income = 0;
        let inRoomHarvesters = _.filter(Game.creeps, (c) => c.memory.overlord === room.name && c.memory.role === 'stationaryHarvester');
        let remoteHarvesters = _.filter(Game.creeps, (c) => c.memory.overlord === room.name && (c.memory.role === 'remoteHarvester'));
        inRoomHarvesters.forEach((h) => income += h.getActiveBodyparts(WORK) * HARVEST_POWER);
        remoteHarvesters.forEach((h) => income += (h.getActiveBodyparts(WORK) * HARVEST_POWER) * 0.7);
        ROOM_ENERGY_PER_TICK[room.name] = income;
    }

    // Cache globals
    cacheRoomItems(room);

    // Set room state
    state.setRoomState(room);

    // Handle Defense
    defense.controller(room);

    // Potential low power mode
    if (room.level === 8) {
        let inBuild = _.filter(room.constructionSites, (s) => s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_ROAD)[0];
        if (room.memory.lowPower) {
            if (room.memory.lowPower + 10000 < Game.time || inBuild || Memory.roomCache[room.name].threatLevel > 2) {
                log.a(room.name + ' is no longer in a low power state.');
                room.memory.lowPower = undefined;
                room.memory.lastLowPower = Game.time;
            }
        } else if (!room.memory.lastLowPower || room.memory.lastLowPower + 12500 < Game.time) {
            let maxLevelRooms = _.filter(Game.rooms, (r) => r.energyAvailable && r.controller.owner && r.controller.owner.username === MY_USERNAME && r.controller.level >= 8 && !r.constructionSites.length);
            let lowPowerRooms = _.filter(Game.rooms, (r) => r.energyAvailable && r.controller.owner && r.controller.owner.username === MY_USERNAME && r.controller.level >= 8 && r.memory.lowPower);
            if (maxLevelRooms.length >= 3 && lowPowerRooms.length < maxLevelRooms.length * 0.5 && Math.random() > 0.8 && !inBuild && (!Memory.saleTerminal.room || room.name !== Memory.saleTerminal.room) && (Game.cpu.bucket < 9000 && (!Memory.lastPixelGenerated || Memory.lastPixelGenerated + 10000 < Game.time))) {
                log.a(room.name + ' has entered a low power state for 10000 ticks.');
                room.memory.lowPower = Game.time;
            }
        }
    } else {
        room.memory.lowPower = undefined;
    }

    // Manage creeps
    let roomCreeps = _.sortBy(_.filter(Game.creeps, (r) => r.memory.overlord === room.name && !r.memory.military && !r.spawning), '.memory.lastManaged');
    // Worker minions
    for (let key in roomCreeps) {
        try {
            if ((Game.cpu.getUsed() - mindStart) > CPULimit * 0.9) break;
            minionController(roomCreeps[key]);
        } catch (e) {
            log.e(roomCreeps[key].name + ' in room ' + roomCreeps[key].room.name + ' experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }

    //Build Room
    if ((!room.memory.bunkerHub && !room.memory.praiseRoom) || (getLevel(room) !== room.controller.level && Game.time % 25 === 0) || (Game.time % 100 === 0 && Math.random() > 0.5)) {
        try {
            planner.buildRoom(room);
        } catch (e) {
            log.e('Room Building for room ' + room.name + ' experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
    // Silence Alerts
    if (Game.time % 2500 === 0) {
        for (let building of room.structures) {
            building.notifyWhenAttacked(false);
        }
    }

    //CPU Check
    if ((Game.cpu.getUsed() - mindStart) > CPULimit) return;

    // Manage creep spawning
    if (Game.time % 5 === 0 || room.memory.praiseRoom) {
        if (room.memory.praiseRoom) {
            spawning.praiseCreepQueue(room);
        } else if (getLevel(room) < 2) {
            spawning.roomStartup(room);
        } else {
            try {
                spawning.essentialCreepQueue(room);
            } catch (e) {
                log.e('Essential Queueing for room ' + room.name + ' experienced an error');
                log.e(e.stack);
                Game.notify(e.stack);
            }
            try {
                if (!room.memory.lowPower) spawning.miscCreepQueue(room);
            } catch (e) {
                log.e('Misc Queueing for room ' + room.name + ' experienced an error');
                log.e(e.stack);
                Game.notify(e.stack);
            }
            if (cpuBucket >= 5000) {
                try {
                    spawning.remoteCreepQueue(room);
                } catch (e) {
                    log.e('Remote Creep Queuing for room ' + room.name + ' experienced an error');
                    log.e(e.stack);
                    Game.notify(e.stack);
                }
            }
        }
    }

    // Observer Control
    if (room.level === 8 && cpuBucket >= 2000 && !room.memory.lowPower) {
        try {
            observers.observerControl(room);
        } catch (e) {
            log.e('Observer Control for room ' + room.name + ' experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }

    // Factory Control
    if (room.level >= 7 && cpuBucket >= 2000 && !room.memory.lowPower) {
        try {
            factory.factoryControl(room);
        } catch (e) {
            log.e('Factory Control for room ' + room.name + ' experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }

    //CPU Check
    if ((Game.cpu.getUsed() - mindStart) > CPULimit) return;

    // Handle Links
    if (room.level >= 5) {
        try {
            links.linkControl(room);
        } catch (e) {
            log.e('Link Control for room ' + room.name + ' experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }

    // Handle Terminals
    if (room.terminal && room.level >= 6 && !room.terminal.cooldown && Game.time % 5 === 0 && !room.memory.lowPower) {
        try {
            terminals.terminalControl(room);
        } catch (e) {
            log.e('Terminal Control for room ' + room.name + ' experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }

    // Store Data
    storedLevel[room.name] = room.controller.level;
    if (room.controller.level >= 6) {
        let currentMinerals = OWNED_MINERALS || [];
        currentMinerals.push(room.mineral.mineralType);
        OWNED_MINERALS = _.uniq(currentMinerals);
    }
    let used = Game.cpu.getUsed() - mindStart;
    let cpuUsageArray = ROOM_CPU_ARRAY[room.name] || [];
    if (cpuUsageArray.length < 50) {
        cpuUsageArray.push(used)
    } else {
        cpuUsageArray.shift();
        cpuUsageArray.push(used);
        if (average(cpuUsageArray) > 20 && Game.time % 150 === 0) {
            log.e(room.name + ' is using a high amount of CPU - ' + average(cpuUsageArray));
            for (let key in TASK_CPU_ARRAY[room.name]) {
                log.e(_.capitalize(key) + ' Avg. CPU - ' + _.round(average(TASK_CPU_ARRAY[room.name][key]), 2));
            }
            Game.notify(room.name + ' is using a high amount of CPU - ' + average(cpuUsageArray));
            for (let key in TASK_CPU_ARRAY[room.name]) {
                log.e(_.capitalize(key) + ' Avg. CPU - ' + _.round(average(TASK_CPU_ARRAY[room.name][key]), 2));
            }
        }
    }
    room.memory.averageCpu = _.round(average(cpuUsageArray), 2);
    ROOM_CPU_ARRAY[room.name] = cpuUsageArray;
};

let errorCount = {};
function minionController(minion) {
    // Set last managed tick
    minion.memory.lastManaged = Game.time;
    // If bucket gets real low kill remotes
    if (Game.cpu.bucket < 1000) {
        if (minion.room.name !== minion.memory.overlord) minion.suicide();
    }
    // If on portal or border move
    if (minion.portalCheck() || minion.borderCheck()) return;
    // Disable notifications
    if (minion.ticksToLive > 1490) minion.notifyWhenAttacked(false);
    // Handle nuke flee
    if (minion.memory.fleeNukeTime && minion.fleeNukeRoom()) return;
    // If idle sleep
    if (minion.idle) return;
    // If minion has been flagged to recycle do so
    if (minion.memory.recycle) return minion.recycleCreep();
    // Chance based CPU saving
    let cpuUsed = Game.cpu.getUsed();
    /**
     if (Game.cpu.bucket < 8000) {
        if ((cpuUsed >= Game.cpu.limit && Math.random() > 0.5) || Math.random() > 0.9) return minion.say('CPU'); else {
            if (Math.random() > Game.cpu.bucket / 8000) return minion.say('BUCKET');
        }
    }**/
    // Track Threat
    diplomacy.trackThreat(minion);
    // Report intel chance
    if (minion.room.name !== minion.memory.overlord && Math.random() > 0.75) {
        minion.room.invaderCheck();
        minion.room.cacheRoomIntel();
    }
    // Set role
    let memoryRole = minion.memory.role;
    // Run role and log CPU
    try {
        let creepRole = require('role.' + memoryRole);
        creepRole.role(minion);
        let used = Game.cpu.getUsed() - cpuUsed;
        let cpuUsageArray = CREEP_CPU_ARRAY[minion.name] || [];
        if (cpuUsageArray.length < 50) {
            cpuUsageArray.push(used)
        } else {
            cpuUsageArray.shift();
            cpuUsageArray.push(used);
            if (average(cpuUsageArray) > 3 && minion.memory.role !== 'claimer') {
                minion.suicide();
                log.e(minion.name + ' was killed for overusing CPU in room ' + roomLink(minion.room.name));
            }
        }
        CREEP_CPU_ARRAY[minion.name] = cpuUsageArray;
        cpuUsageArray = CREEP_ROLE_CPU_ARRAY[minion.role] || [];
        if (cpuUsageArray.length < 50) {
            cpuUsageArray.push(used)
        } else {
            cpuUsageArray.shift();
            cpuUsageArray.push(used);
        }
        CREEP_ROLE_CPU_ARRAY[minion.role] = cpuUsageArray;
        let roomCreepCpu = ROOM_CREEP_CPU_OBJECT[minion.memory.overlord] || {};
        cpuUsageArray = roomCreepCpu[minion.name] || [];
        if (cpuUsageArray.length < 50) {
            cpuUsageArray.push(used)
        } else {
            cpuUsageArray.shift();
            cpuUsageArray.push(used);
        }
        roomCreepCpu[minion.name] = cpuUsageArray;
        ROOM_CREEP_CPU_OBJECT[minion.memory.overlord] = roomCreepCpu;
        minion.room.visual.text(
            _.round(average(cpuUsageArray), 2),
            minion.pos.x,
            minion.pos.y,
            {opacity: 0.8, font: 0.4, stroke: '#000000', strokeWidth: 0.05}
        );
    } catch (e) {
        if (!errorCount[minion.name]) errorCount[minion.name] = 1; else errorCount[minion.name] += 1;
        if (errorCount[minion.name] < 10) {
            if (errorCount[minion.name] === 1) {
                log.e(minion.name + ' experienced an error in room ' + roomLink(minion.room.name));
                log.e(e.stack);
                Game.notify(e.stack);
            }
        } else if (errorCount[minion.name] >= 50) {
            if (errorCount[minion.name] === 50) log.e(minion.name + ' experienced an error in room ' + roomLink(minion.room.name) + ' and has been killed.');
            minion.suicide();
        } else {
            if (errorCount[minion.name] === 10) log.e(minion.name + ' experienced an error in room ' + roomLink(minion.room.name) + ' and has been marked for recycling due to hitting the error cap.');
            minion.memory.recycle = true;
        }
    }
}

function cacheRoomItems(room) {
    // Cache number of spaces around sources for things
    if (!ROOM_SOURCE_SPACE[room.name]) {
        let spaces = 0;
        for (let source of room.sources) spaces += source.pos.countOpenTerrainAround();
        ROOM_SOURCE_SPACE[room.name] = spaces;
    }
    // Cache number of spaces around sources for things
    if (!ROOM_CONTROLLER_SPACE[room.name]) {
        ROOM_CONTROLLER_SPACE[room.name] = room.controller.pos.countOpenTerrainAround();
    }
}