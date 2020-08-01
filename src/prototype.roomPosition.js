/*
 * Copyright (c) 2020.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

/**
 * Created by Bob on 7/3/2017.
 */
'use strict';

let distanceCache = {};

RoomPosition.prototype.checkIfOutOfBounds = function () {
    return this.x > 46 || this.x < 3 || this.y > 46 || this.y < 3;
};

RoomPosition.prototype.getClosestSource = function () {
    let source = this.findClosestByRange(FIND_SOURCES_ACTIVE, {filter: (s) => s.pos.countOpenTerrainAround() > _.filter(Game.rooms[this.roomName].creeps, (c) => c.memory && c.memory.source === s.id).length});
    if (!source) {
        source = this.findClosestByRange(FIND_SOURCES, {filter: (s) => s.pos.countOpenTerrainAround() > _.filter(Game.rooms[this.roomName].creeps, (c) => c.memory && c.memory.source === s.id).length});
    }
    return source;
};

RoomPosition.prototype.findInRangeStructures = function (objects, range, structureTypes) {
    return this.findInRange(objects, 1, {
        filter: function (object) {
            return structureTypes.indexOf(object.structureType) >= 0;
        }
    });
};

RoomPosition.prototype.findClosestStructure = function (structures, structureType) {
    return this.findClosestByPath(structures, {
        filter: function (object) {
            return object.structureType === structureType;
        }
    });
};

RoomPosition.prototype.getAdjacentPosition = function (direction) {
    const adjacentPos = [
        [0, 0],
        [0, -1],
        [1, -1],
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1]
    ];
    try {
        return new RoomPosition(this.x + adjacentPos[direction][0], this.y + adjacentPos[direction][1], this.roomName);
    } catch (e) {
        return undefined;
    }
};

RoomPosition.prototype.countOpenTerrainAround = function () {
    let impassible = 0;
    for (let xOff = -1; xOff <= 1; xOff++) {
        for (let yOff = -1; yOff <= 1; yOff++) {
            if (xOff !== 0 || yOff !== 0) {
                let pos = new RoomPosition(this.x + xOff, this.y + yOff, this.roomName);
                if (pos.checkForImpassible() || (pos.checkForCreep() && !pos.checkForCreep().getActiveBodyparts(MOVE))) impassible += 1;
            }
        }
    }
    return 8 - impassible;
};

RoomPosition.prototype.checkForWall = function () {
    return Game.map.getRoomTerrain(this.roomName).get(this.x, this.y) === 1;
};

RoomPosition.prototype.checkForSwamp = function () {
    return Game.map.getRoomTerrain(this.roomName).get(this.x, this.y) === 2;
};

RoomPosition.prototype.checkForCreep = function () {
    return this.lookFor(LOOK_CREEPS)[0];
};

RoomPosition.prototype.checkForPlain = function () {
    return !Game.map.getRoomTerrain(this.roomName).get(this.x, this.y);
};

RoomPosition.prototype.checkForBuiltWall = function () {
    return _.filter(this.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_WALL)[0];
};

RoomPosition.prototype.checkForPortal = function () {
    return _.filter(this.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_PORTAL)[0];
};

RoomPosition.prototype.checkForRampart = function () {
    return _.filter(this.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_RAMPART)[0];
};

RoomPosition.prototype.checkForBarrierStructure = function () {
    return _.filter(this.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL)[0];
};

RoomPosition.prototype.checkForObstacleStructure = function () {
    let obstacle = this.lookFor(LOOK_STRUCTURES).some(s => OBSTACLE_OBJECT_TYPES.includes(s.structureType));
    if (!obstacle) obstacle = _.filter(this.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_RAMPART && !s.my && !s.isPublic)[0];
    return obstacle;
};

RoomPosition.prototype.checkForConstructionSites = function () {
    return this.lookFor(LOOK_CONSTRUCTION_SITES)[0];
};

RoomPosition.prototype.checkForRoad = function () {
    return _.filter(this.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_ROAD)[0];
};

RoomPosition.prototype.checkForContainer = function () {
    return _.filter(this.lookFor(LOOK_STRUCTURES), (s) => s.structureType === STRUCTURE_CONTAINER)[0];
};

RoomPosition.prototype.checkForEnergy = function () {
    return this.lookFor(LOOK_ENERGY)[0];
};

RoomPosition.prototype.checkForAllStructure = function (ramparts = false) {
    if (Game.rooms[this.roomName]) {
        if (!ramparts) return _.filter(this.lookFor(LOOK_STRUCTURES), (s) => s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_ROAD);
        return this.lookFor(LOOK_STRUCTURES);
    } else {
        return undefined;
    }
};

RoomPosition.prototype.checkForImpassible = function (ignoreWall = false) {
    if (ignoreWall) {
        if (this.checkForObstacleStructure()) return true;
    } else {
        if (this.checkForObstacleStructure() || this.checkForWall()) return true;
    }
};

RoomPosition.prototype.isExit = function () {
    return this.x <= 1 || this.x >= 48 || this.y <= 1 || this.y >= 48;
};

RoomPosition.prototype.isValid = function () {
    if (this.x < 0 || this.y < 0) {
        return false;
    }
    return !(this.x > 49 || this.y > 49);
};

RoomPosition.prototype.buildRoomPosition = function (direction, distance) {
    if (distance > 1) {
        log.i('!!!! Distance > 1 not yet implemented');
    }
    return this.getAdjacentPosition((direction - 1) % 8 + 1);
};

RoomPosition.prototype.rangeToTarget = function (target) {
    if (!target) return;
    // Distance cache fails hard on MMO
    delete Memory._distanceCache;
    if (Game.shard.name === 'shard0' || Game.shard.name === 'shard1' || Game.shard.name === 'shard2' || Game.shard.name === 'shard3') {
        return this.getRangeTo(target);
    }
    let cached = getCachedTargetDistance(this, target);
    if (cached) return cached;
    return cacheTargetDistance(this, target);
};

function cacheTargetDistance(origin, target) {
    let key, cache;
    if (target instanceof RoomPosition) key = getPathKey(origin, target); else key = getPathKey(origin, target.pos);
    cache = distanceCache
    let distance = origin.getRangeTo(target);
    cache[key] = {
        distance: distance,
        uses: 1,
        tick: Game.time
    };
    distanceCache = cache;
    return distance;
}

function getCachedTargetDistance(origin, target) {
    let cache = distanceCache;
    if (cache) {
        let cachedDistance;
        if (target instanceof RoomPosition) cachedDistance = cache[getPathKey(origin, target)]; else cachedDistance = cache[getPathKey(origin, target.pos)];
        if (cachedDistance) {
            cachedDistance.uses += 1;
            distanceCache = cache;
            return cachedDistance.distance;
        }
        return;
    } else {
        return;
    }
}

function getPathKey(from, to) {
    return getPosKey(from) + '$' + getPosKey(to);
}

function getPosKey(pos) {
    return pos.x + 'x' + pos.y + pos.roomName;
}

//SemperRabbit Shares
RoomPosition.prototype.isEqualToXY = function (x, y) {
    return x === this.x && y === this.y;
};
RoomPosition.prototype.isEqualToPos = function (obj) {
    return obj.x === this.x && obj.y === this.y && obj.roomName === this.roomName;
};
RoomPosition.prototype.isEqualToRoomObject = function (obj) {
    return obj.pos.x === this.x && obj.pos.y === this.y && obj.pos.roomName === this.roomName;
};
RoomPosition.prototype.inRangeToXY = function (x, y, range) {
    return ((x - this.x) < 0 ? (this.x - x) : (x - this.x)) <= range && ((y - this.y) < 0 ? (this.y - y) : (y - this.y)) <= range;
};
RoomPosition.prototype.inRangeToPos = function (obj, range) {
    return ((obj.x - this.x) < 0 ? (this.x - obj.x) : (obj.x - this.x)) <= range && ((obj.y - this.y) < 0 ? (this.y - obj.y) : (obj.y - this.y)) <= range;
};
RoomPosition.prototype.inRangeToRoomObject = function (obj, range) {
    return ((obj.pos.x - this.x) < 0 ? (this.x - obj.pos.x) : (obj.pos.x - this.x)) <= range && ((obj.pos.y - this.y) < 0 ? (this.y - obj.pos.y) : (obj.pos.y - this.y)) <= range;
};
RoomPosition.prototype.isNearToXY = function (x, y) {
    return ((x - this.x) < 0 ? (this.x - x) : (x - this.x)) <= 1 && ((y - this.y) < 0 ? (this.y - y) : (y - this.y)) <= 1;
};
RoomPosition.prototype.isNearToPos = function (obj) {
    return ((obj.x - this.x) < 0 ? (this.x - obj.x) : (obj.x - this.x)) <= 1 && ((obj.y - this.y) < 0 ? (this.y - obj.y) : (obj.y - this.y)) <= 1;
};
RoomPosition.prototype.isNearToRoomObject = function (obj) {
    return ((obj.pos.x - this.x) < 0 ? (this.x - obj.pos.x) : (obj.pos.x - this.x)) <= 1 && ((obj.pos.y - this.y) < 0 ? (this.y - obj.pos.y) : (obj.pos.y - this.y)) <= 1;
};
