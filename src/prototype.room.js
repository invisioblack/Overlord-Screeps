/*
 * Copyright (c) 2020.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

/**
 * Created by rober on 7/5/2017.
 */
'use strict';

Room.prototype.constructionSites = function () {
    return _.filter(Game.constructionSites, (s) => s.pos.roomName === this.name);
};

Object.defineProperty(Room.prototype, 'user', {
    get: function () {
        if (!this._user) {
            if (!this.controller) this._user = undefined;
            else if (this.controller.owner) this._user = this.controller.owner.username;
            else if (this.controller.reservation) this._user = this.controller.reservation.username;
            else this._user = undefined;
        }
        return this._user;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'sources', {
    get: function () {
        // If we dont have the value stored locally
        if (!this._sources) {
            // If we dont have the value stored in memory
            if (!this.memory.sourceIds) {
                // Find the sources and store their id's in memory,
                // NOT the full objects
                this.memory.sourceIds = this.find(FIND_SOURCES)
                    .map(source => source.id);
            }
            // Get the source objects from the id's in memory and store them locally
            this._sources = this.memory.sourceIds.map(id => Game.getObjectById(id));
        }
        // return the locally stored value
        return this._sources;
    },
    set: function (newValue) {
        // when storing in memory you will want to change the setter
        // to set the memory value as well as the local value
        this.memory.sources = newValue.map(source => source.id);
        this._sources = newValue;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'deposits', {
    get: function () {
        // If we dont have the value stored locally
        if (!this._deposits) {
            this._deposits = this.find(FIND_DEPOSITS)[0];
        }
        // return the locally stored value
        return this._deposits;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'mineral', {
    get: function () {
        // If we dont have the value stored locally
        if (!this._mineral) {
            this._mineral = this.find(FIND_MINERALS)[0];
        }
        // return the locally stored value
        return this._mineral;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'structures', {
    get: function () {
        if (!this._structures) {
            this._structures = this.find(FIND_STRUCTURES);
        }
        return this._structures;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'energyState', {
    get: function () {
        if (!this._energyState) {
            this._energyState = 0;
            if (this.energy >= ENERGY_AMOUNT * 2.5) {
                this._energyState = 2;
            } else if (this.energy >= ENERGY_AMOUNT) {
                this._energyState = 1;
            }
        }
        return this._energyState;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'hostileStructures', {
    get: function () {
        if (!this._hostileStructures) {
            this._hostileStructures = _.filter(this.structures, (s) => !s.my && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTAINER &&
                s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_CONTROLLER && s.structureType !== STRUCTURE_KEEPER_LAIR && (!s.owner || !_.includes(FRIENDLIES, s.owner)));
        }
        return this._hostileStructures;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'droppedResources', {
    get: function () {
        if (!this._droppedResources) {
            this._droppedResources = this.find(FIND_DROPPED_RESOURCES);
        }
        return this._droppedResources;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'droppedEnergy', {
    get: function () {
        if (!this._droppedEnergy) {
            this._droppedEnergy = this.find(FIND_DROPPED_RESOURCES, {filter: (r) => r.resourceType === RESOURCE_ENERGY});
        }
        return this._droppedEnergy;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'creeps', {
    get: function () {
        if (!this._creeps) {
            this._creeps = this.find(FIND_CREEPS);
        }
        return this._creeps;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'powerCreeps', {
    get: function () {
        if (!this._powerCreeps) {
            this._powerCreeps = this.find(FIND_POWER_CREEPS);
        }
        return this._powerCreeps;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'hostileCreeps', {
    get: function () {
        if (!this._Hostilecreeps) {
            if (!Memory.targetRooms[this.name] || Memory.targetRooms[this.name].type === 'guard' || (Memory.roomCache[this.name] && _.includes(FRIENDLIES, Memory.roomCache[this.name].user))) {
                this._Hostilecreeps = _.filter(this.creeps, (c) => !c.my && ((_.includes(Memory._threats, c.owner.username) || (this.memory.operation === 'marauding' && !_.includes(FRIENDLIES, c.owner.username))) || c.owner.username === 'Invader' || c.owner.username !== 'Source Keeper'));
                this._Hostilecreeps.concat(_.filter(this.powerCreeps, (c) => !c.my && (_.includes(Memory._threats, c.owner.username))));
            } else {
                this._Hostilecreeps = _.filter(this.creeps, (c) => !c.my && (!_.includes(FRIENDLIES, c.owner.username) || c.owner.username === 'Invader' || c.owner.username !== 'Source Keeper'));
                this._Hostilecreeps.concat(_.filter(this.powerCreeps, (c) => !c.my && (!_.includes(FRIENDLIES, c.owner.username))));
            }
        }
        return this._Hostilecreeps;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'friendlyCreeps', {
    get: function () {
        if (!this._friendlyCreeps) {
            this._friendlyCreeps = _.filter(this.creeps, (c) => (_.includes(FRIENDLIES, c.owner.username) || c.my) && !_.includes(Memory._threats, c.owner.username));
        }
        return this._friendlyCreeps;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'constructionSites', {
    get: function () {
        if (!this._constructionSites) {
            this._constructionSites = this.find(FIND_CONSTRUCTION_SITES);
        }
        return this._constructionSites;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'tombstones', {
    get: function () {
        if (!this._tombstones) {
            this._tombstones = this.find(FIND_TOMBSTONES);
        }
        return this._tombstones;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'ruins', {
    get: function () {
        if (!this._ruins) {
            this._ruins = this.find(FIND_RUINS);
        }
        return this._ruins;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'level', {
    get: function () {
        if (!this._level) {
            this._level = this.controller.level;
        }
        return this._level;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, 'energy', {
    get: function () {
        if (!this._energy) {
            this._energy = getRoomResource(this, RESOURCE_ENERGY);
        }
        return this._energy;
    },
    enumerable: false,
    configurable: true
});

/**
 * Provides structure memory.
 */
Object.defineProperty(StructureLab.prototype, 'memory', {
    get: function () {
        if (Memory.structureMemory === undefined || !Memory.structureMemory) {
            Memory.structureMemory = {};
        }
        if (Memory.structureMemory[this.id] === undefined || !Memory.structureMemory[this.id]) {
            Memory.structureMemory[this.id] = {};
        }
        return Memory.structureMemory[this.id];
    },
    set: function (v) {
        return _.set(Memory, 'structureMemory.' + this.id, v);
    },
    configurable: true,
    enumerable: false,
});

Object.defineProperty(StructureTerminal.prototype, 'memory', {
    get: function () {
        if (Memory.structureMemory === undefined || !Memory.structureMemory) {
            Memory.structureMemory = {};
        }
        if (Memory.structureMemory[this.id] === undefined || !Memory.structureMemory[this.id]) {
            Memory.structureMemory[this.id] = {};
        }
        return Memory.structureMemory[this.id];
    },
    set: function (v) {
        return _.set(Memory, 'structureMemory.' + this.id, v);
    },
    configurable: true,
    enumerable: false,
});

// Creates a room prototype that accepts RESOURCE_* Constants that gets you the total of that resource in a room.
// EXAMPLE USAGE - Game.rooms['W0S0'].store(RESOURCE_ENERGY);
Room.prototype.store = function (resource) {
    if (!this._resourceStore || this._resourceStore.tick !== Game.time) {
        this._resourceStore = {};
        this._resourceStore.tick = Game.time;
    }
    if (!this._resourceStore[resource]) {
        this._resourceStore[resource] = getRoomResource(this, resource);
    }
    return this._resourceStore[resource];
};

function getRoomResource(room, resource) {
    if (!room || !resource) return undefined;
    let count = 0;
    _.filter(room.structures, (s) => s.store && s.store[resource] && s.structureType !== STRUCTURE_NUKER &&
        s.structureType !== STRUCTURE_TOWER && (resource !== RESOURCE_ENERGY || s.structureType !== STRUCTURE_LAB)).forEach((c) => count += c.store[resource]);
    _.filter(room.creeps, (s) => s.store[resource]).forEach((c) => count += c.store[resource]);
    _.filter(room.droppedResources, (r) => r.resourceType === resource).forEach((r) => count += r.amount);
    return count;
}

Room.prototype.cacheRoomIntel = function (force = false) {
    if (Memory.roomCache && !force && Memory.roomCache[this.name] && Memory.roomCache[this.name].cached + 1501 > Game.time) return;
    let room = Game.rooms[this.name];
    let potentialTarget, nonCombats, mineral, sk, power, portal, user, level, closestRange, important, owner,
        reservation, commodity, safemode, hubCheck;
    if (room) {
        // Make NCP array
        let ncpArray = Memory.ncpArray || [];
        // Get range to nearest room of yours
        closestRange = this.findClosestOwnedRoom(true);
        // Get special rooms via name
        //let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(room.name);
        let isHighway = !room.controller;
        if (!isHighway) isHighway = undefined;
        let cache = Memory.roomCache || {};
        let sources = room.sources;
        nonCombats = _.filter(room.creeps, (e) => (!e.getActiveBodyparts(ATTACK) && !e.getActiveBodyparts(RANGED_ATTACK)));
        if (_.filter(room.structures, (e) => e.structureType === STRUCTURE_KEEPER_LAIR)[0]) sk = true;
        if (room.controller) {
            safemode = room.controller.safeMode;
            if (room.controller.owner) {
                owner = room.controller.owner.username;
                user = room.controller.owner.username;
                // Signage NCP check
                if (room.controller.sign) {
                    let text = room.controller.sign.text.toLowerCase();
                    if (text.includes('overmind') || text.includes('tooangel') || text.includes('quorum') || text.includes('ᴏᴠᴇʀᴍɪɴᴅ')) {
                        ncpArray.push(room.controller.sign.username);
                    } else if (_.includes(ncpArray, room.controller.sign.username)) {
                        _.remove(ncpArray, (u) => u === room.controller.sign.username);
                    }
                }
            } else if (room.controller.reservation) {
                reservation = room.controller.reservation.username;
                user = room.controller.reservation.username;
            } else {
                let roomPlanner = require('module.roomPlanner');
                mineral = room.mineral.mineralType;
                if (sources.length === 2) hubCheck = roomPlanner.hubCheck(this);
            }
            level = room.controller.level || undefined;
            if (_.includes(HOSTILES, user)) important = true;
        }
        // Store portal info
        portal = _.filter(room.structures, (e) => e.structureType === STRUCTURE_PORTAL);
        if (portal.length) {
            let portalArray = [];
            let destinationArray = [];
            for (let obj of portal) {
                if (obj.ticksToDecay && obj.ticksToDecay <= 500) continue;
                if (!_.includes(destinationArray, obj.destination)) destinationArray.push(obj.destination); else continue;
                let decayTick = obj.ticksToDecay + Game.time || 99999999999;
                portalArray.push({decayTick: decayTick, destination: obj.destination})
            }
            if (portalArray.length) portal = JSON.stringify(portalArray); else portal = undefined;
        } else {
            portal = undefined;
        }
        // Deposit info
        if (room.deposits) {
            if (room.deposits.ticksToDecay > 4500) {
                commodity = room.deposits.pos.countOpenTerrainAround();
            }
        }
        // Store power info
        power = _.filter(room.structures, (e) => e && e.structureType === STRUCTURE_POWER_BANK && e.ticksToDecay > 1000);
        if (power.length && power[0].pos.countOpenTerrainAround() > 1) power = Game.time + power[0].ticksToDecay; else power = undefined;
        if (!user && nonCombats.length >= 2) {
            potentialTarget = true;
            user = nonCombats[0].owner.username;
        }
        let key = room.name;
        cache[key] = {
            cached: Game.time,
            name: room.name,
            sources: sources.length,
            mineral: mineral,
            commodity: commodity,
            owner: owner,
            reservation: reservation,
            level: level,
            sk: sk,
            potentialTarget: potentialTarget,
            user: user,
            safemode: safemode,
            portal: portal,
            power: power,
            isHighway: isHighway,
            closestRange: closestRange,
            important: important,
            hubCheck: hubCheck,
            forestPvp: room.controller && room.controller.sign && room.controller.sign.text.toLowerCase().includes('@PVP@'),
            invaderCore: _.filter(room.structures, (s) => s.structureType === STRUCTURE_INVADER_CORE).length,
            towers: _.filter(room.structures, (s) => s.structureType === STRUCTURE_TOWER && s.energy > 10).length,
            structures: _.filter(room.structures, (s) => s.structureType !== STRUCTURE_ROAD && s.structureType !== STRUCTURE_CONTROLLER && s.structureType !== STRUCTURE_CONTAINER && s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_KEEPER_LAIR && s.structureType !== STRUCTURE_EXTRACTOR).length
        };
        Memory.ncpArray = _.uniq(ncpArray);
        Memory.roomCache = cache;
    }
};

let invaderAlert = {};
Room.prototype.invaderCheck = function () {
    if (Memory.roomCache && Memory.roomCache[this.name] && Memory.roomCache[this.name].lastInvaderCheck + 10 > Game.time && !Memory.roomCache[this.name].threatLevel) return;
    if (!Memory.roomCache || !Memory.roomCache[this.name]) this.cacheRoomIntel();
    if (this.hostileCreeps.length) {
        if (!Memory.roomCache) Memory.roomCache = {};
        if (!Memory.roomCache[this.name]) Memory.roomCache[this.name] = {};
        Memory.roomCache[this.name].lastInvaderCheck = Game.time;
        // No invader checks for hostile rooms
        if (((this.controller && this.controller.owner && !_.includes(FRIENDLIES, this.controller.owner.username)) || (this.controller && this.controller.reservation && !_.includes(FRIENDLIES, this.controller.reservation.username))) || this.findClosestOwnedRoom(true) >= 5) {
            Memory.roomCache[this.name].numberOfHostiles = undefined;
            Memory.roomCache[this.name].responseNeeded = undefined;
            Memory.roomCache[this.name].alertEmail = undefined;
            Memory.roomCache[this.name].requestingSupport = undefined;
            Memory.roomCache[this.name].threatLevel = undefined;
            Memory.roomCache[this.name].lastInvaderCheck = undefined;
            return;
        }
        let invader = this.hostileCreeps;
        if (invader.length > 0) {
            let hostileCombatPower = 0;
            let armedHostiles = _.filter(this.hostileCreeps, (c) => c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(RANGED_ATTACK));
            for (let i = 0; i < armedHostiles.length; i++) {
                hostileCombatPower += armedHostiles[i].combatPower;
            }
            let alliedCombatPower = 0;
            let armedFriendlies = _.filter(this.friendlyCreeps, (c) => c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(RANGED_ATTACK));
            for (let i = 0; i < armedFriendlies.length; i++) {
                alliedCombatPower += armedFriendlies[i].combatPower;
            }
            Memory.roomCache[this.name].hostilePower = hostileCombatPower;
            Memory.roomCache[this.name].friendlyPower = alliedCombatPower;
            let armedInvader = _.filter(invader, (c) => c.getActiveBodyparts(ATTACK) || c.getActiveBodyparts(RANGED_ATTACK) || c.getActiveBodyparts(HEAL) || c.getActiveBodyparts(WORK) >= 6 || c.getActiveBodyparts(CLAIM));
            Memory.roomCache[this.name].tickDetected = Game.time;
            if (!Memory.roomCache[this.name].numberOfHostiles || Memory.roomCache[this.name].numberOfHostiles < invader.length) {
                Memory.roomCache[this.name].numberOfHostiles = invader.length || 1;
            }
            // Make owner array
            let ownerArray = [];
            invader.forEach((c) => ownerArray.push(c.owner.username));
            ownerArray = _.uniq(ownerArray);
            // Determine threat
            if (!armedInvader.length && (!this.controller || !this.controller.safeMode)) {
                Memory.roomCache[this.name].threatLevel = 0;
            } else if ((invader.length === 1 && invader[0].owner.username === 'Invader') || (this.controller && this.controller.safeMode)) {
                Memory.roomCache[this.name].threatLevel = 1;
                Memory.roomCache[this.name].lastInvaderSighting = Game.time;
                if (invaderAlert[this.name] < Game.time && Game.time % 50 === 0) {
                    invaderAlert[this.name] = Game.time;
                    log.a('Invaders detected in ' + roomLink(this.name) + '. ' + invader.length +
                        ' creeps detected. (Invader/Friendly Power Present - ' + hostileCombatPower + '/' + alliedCombatPower + ')', 'RESPONSE COMMAND');
                }
                Memory.roomCache[this.name].responseNeeded = true;
            } else if (invader.length > 1 && invader[0].owner.username === 'Invader' && ownerArray.length === 1 && hostileCombatPower) {
                Memory.roomCache[this.name].threatLevel = 2;
                Memory.roomCache[this.name].lastInvaderSighting = Game.time;
                if (invaderAlert[this.name] < Game.time && Game.time % 50 === 0) {
                    invaderAlert[this.name] = Game.time;
                    log.a('Invaders detected in ' + roomLink(this.name) + '. ' + invader.length +
                        ' creeps detected. (Invader/Friendly Power Present - ' + hostileCombatPower + '/' + alliedCombatPower + ')', 'RESPONSE COMMAND');
                }
                Memory.roomCache[this.name].responseNeeded = true;
            } else if (invader.length === 1 && invader[0].owner.username !== 'Invader' && hostileCombatPower) {
                Memory.roomCache[this.name].threatLevel = 3;
                Memory.roomCache[this.name].lastPlayerSighting = Game.time;
                if (invaderAlert[this.name] < Game.time && Game.time % 50 === 0) {
                    invaderAlert[this.name] = Game.time;
                    log.a('Players creeps detected in ' + roomLink(this.name) + '. ' + invader.length +
                        ' hostiles detected. Owners - ' + ownerArray.toString() + ' (Invader/Friendly Power Present - ' + hostileCombatPower + '/' + alliedCombatPower + ')', 'RESPONSE COMMAND');
                }
                Memory.roomCache[this.name].responseNeeded = true;
                let roomHeat = Memory.roomCache[this.name].roomHeat || 0;
                Memory.roomCache[this.name].roomHeat = roomHeat + (invader.length * 5);
            } else if (invader.length > 1 && (invader[0].owner.username !== 'Invader' || ownerArray.length > 1) && hostileCombatPower) {
                Memory.roomCache[this.name].threatLevel = 4;
                Memory.roomCache[this.name].lastPlayerSighting = Game.time;
                if (invaderAlert[this.name] < Game.time && Game.time % 50 === 0) {
                    invaderAlert[this.name] = Game.time;
                    log.a('Players creeps detected in ' + roomLink(this.name) + '. ' + invader.length +
                        ' hostiles detected. Owners - ' + ownerArray.toString() + ' (Invader/Friendly Power Present - ' + hostileCombatPower + '/' + alliedCombatPower + ')', 'RESPONSE COMMAND');
                }
                Memory.roomCache[this.name].responseNeeded = true;
                let roomHeat = Memory.roomCache[this.name].roomHeat || 0;
                Memory.roomCache[this.name].roomHeat = roomHeat + (invader.length * 5);
            }
            return Memory.roomCache[this.name].threatLevel > 0;
        }
    } else if (Memory.roomCache[this.name].threatLevel) {
        let waitOut = 15;
        if (Memory.roomCache[this.name].threatLevel > 3) waitOut = 50;
        if (Memory.roomCache[this.name].tickDetected + waitOut < Game.time) {
            Memory.roomCache[this.name].threatLevel = undefined;
            let roomHeat = (Memory.roomCache[this.name].roomHeat - 0.25) || 0;
            if (roomHeat <= 0) {
                Memory.roomCache[this.name].roomHeat = undefined;
            } else {
                Memory.roomCache[this.name].roomHeat = roomHeat;
            }
            Memory.roomCache[this.name].numberOfHostiles = undefined;
            Memory.roomCache[this.name].responseNeeded = undefined;
            Memory.roomCache[this.name].alertEmail = undefined;
            Memory.roomCache[this.name].requestingSupport = undefined;
        }
        return false;
    } else if (Memory.roomCache[this.name].roomHeat) {
        let roomHeat = Memory.roomCache[this.name].roomHeat - 0.25;
        if (roomHeat <= 0) {
            Memory.roomCache[this.name].roomHeat = undefined;
        } else {
            Memory.roomCache[this.name].roomHeat = roomHeat;
        }
    }
};

Room.prototype.findClosestOwnedRoom = function (range = false, safePath = false, minLevel = 1) {
    let distance = 0;
    let closest;
    for (let key of Memory.myRooms) {
        let room = Game.rooms[key];
        if (!room || room.controller.level < minLevel) continue;
        let range = Game.map.findRoute(this, room).length;
        if (safePath) range = this.shibRoute(room).length - 1;
        if (!distance) {
            distance = range;
            closest = room.name;
        } else if (range < distance) {
            distance = range;
            closest = room.name;
        }
    }
    if (!range) return closest;
    return distance;
};