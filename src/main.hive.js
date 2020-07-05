/*
 * Copyright (c) 2020.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

let overlord = require('main.overlord');
let highCommand = require('military.highCommand');
let labs = require('module.labController');
let power = require('module.powerManager');
let spawning = require('module.creepSpawning');
let expansion = require('module.expansion');
let diplomacy = require('module.diplomacy');
let hud = require('module.hud');

module.exports.hiveMind = function () {

    // Handle Diplomacy
    try {
        diplomacy.diplomacyOverlord();
    } catch (e) {
        log.e('Diplomacy Module experienced an error');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    // High Command
    try {
        highCommand.highCommand();
    } catch (e) {
        log.e('High Command Module experienced an error');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    // Handle Labs
    if (Game.cpu.bucket >= 5000) {
        try {
            labs.labManager();
        } catch (e) {
            log.e('Lab Module experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
    // Military first
    let militaryCreeps = shuffle(_.filter(Game.creeps, (r) => r.memory.military || !r.memory.overlord));
    for (let key in militaryCreeps) {
        try {
            minionController(militaryCreeps[key]);
        } catch (e) {
            log.e('Military Minion Controller experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
    // Process Overlords
    let overlordCPULimit = adjustedCPULimit(Game.cpu.limit - 5, Game.cpu.bucket) / _.size(Memory.myRooms);
    for (let key of Memory.myRooms) {
        let activeRoom = Game.rooms[key];
        try {
            overlord.overlordMind(activeRoom, overlordCPULimit);
        } catch (e) {
            log.e('Overlord Module experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
    //Expansion Manager
    if (Game.time % 25 === 0) {
        let myRooms = _.filter(Game.rooms, (r) => r.energyAvailable && r.controller.owner && r.controller.owner.username === MY_USERNAME);
        if (Memory.maxLevel >= 3 && Memory.minLevel > 3 && Game.gcl.level > Memory.myRooms.length) {
            let safemode = _.filter(myRooms, (r) => r.controller.safeMode);
            let claimMission = _.filter(Memory.auxiliaryTargets, (t) => t.type === 'claimScout' || t.type === 'claim');
            if ((!safemode.length || !Memory._badBoyArray || !Memory._badBoyArray.length) && !claimMission.length) {
                try {
                    expansion.claimNewRoom();
                } catch (e) {
                    log.e('Expansion Module experienced an error');
                    log.e(e.stack);
                    Game.notify(e.stack);
                }
            }
        }
    }

    // Global creep queue
    if (Game.time % 25 === 0) {
        try {
            spawning.globalCreepQueue();
        } catch (e) {
            log.e('Military Creep queue experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
    // Power Processing
    try {
        power.powerControl();
    } catch (e) {
        log.e('Power Manager experienced an error.');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    //Process creep build queues
    try {
        spawning.processBuildQueue();
    } catch (e) {
        log.e('Creep build queue experienced an error');
        log.e(e.stack);
        Game.notify(e.stack);
    }
    //Room HUD (If CPU Allows)
    if (Game.cpu.bucket > 1000) {
        try {
            hud.hud();
        } catch (e) {
            log.e('Room HUD experienced an error');
            log.e(e.stack);
            Game.notify(e.stack);
        }
    }
};

let errorCount = {};
function minionController(minion) {
    // If on portal move
    if (minion.portalCheck() || minion.borderCheck()) return;
    // Disable notifications
    if (minion.ticksToLive > 1450) minion.notifyWhenAttacked(false);
    // If minion has been flagged to recycle do so
    if (!minion.memory.role || minion.memory.recycle) return minion.recycleCreep();
    // If idle sleep
    if (minion.idle) return;
    // Track threat
    diplomacy.trackThreat(minion);
    // Handle nuke flee
    if (minion.memory.fleeNukeTime && minion.fleeNukeRoom(minion.memory.fleeNukeRoom)) return;
    // Set role
    let memoryRole = minion.memory.role;
    let start = Game.cpu.getUsed();
    try {
        let creepRole = require('role.' + memoryRole);
        if (minion.borderCheck()) return;
        // Report intel chance
        if (minion.room.name !== minion.memory.overlord && Math.random() > 0.5) {
            minion.room.invaderCheck();
            minion.room.cacheRoomIntel();
        }
        creepRole.role(minion);
        let used = Game.cpu.getUsed() - start;
        let cpuUsageArray = CREEP_CPU_ARRAY[minion.name] || [];
        if (cpuUsageArray.length < 50) {
            cpuUsageArray.push(used)
        } else {
            cpuUsageArray.shift();
            cpuUsageArray.push(used);
            if (average(cpuUsageArray) > 7.5) {
                minion.suicide();
                if (minion.memory.military && minion.memory.destination && (Memory.targetRooms[minion.memory.destination] || Memory.auxiliaryTargets[minion.memory.destination])) {
                    delete Memory.targetRooms[minion.memory.destination];
                    delete Memory.auxiliaryTargets[minion.memory.destination];
                }
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
        let roomCreepCpu = ROOM_CREEP_CPU_OBJECT['military'] || {};
        cpuUsageArray = roomCreepCpu[minion.name] || [];
        if (cpuUsageArray.length < 50) {
            cpuUsageArray.push(used)
        } else {
            cpuUsageArray.shift();
            cpuUsageArray.push(used);
        }
        roomCreepCpu[minion.name] = cpuUsageArray;
        ROOM_CREEP_CPU_OBJECT['military'] = roomCreepCpu;
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

