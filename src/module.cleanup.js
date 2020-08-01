/*
 * Copyright (c) 2020.
 * Github - Shibdib
 * Name - Bob Sardinia
 * Project - Overlord-Bot (Screeps)
 */

module.exports.cleanup = function () {
//CLEANUP
    if (Game.time % 100 === 0) {
        cleanPathCacheByUsage(); //clean path and distance caches
        cleanDistanceCacheByUsage();
        cleanRouteCacheByAge();
        cleanRouteCacheByUsage();
        cleanConstructionSites();
        cleanRoomIntel();
        cleanStructureMemory();
    }
    if (Game.time % EST_TICKS_PER_DAY === 0) {
        delete Memory._pathCache;
        delete Memory._distanceCache;
    }
    if (Game.time % 5 === 0) {
        for (let name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
                delete CREEP_CPU_ARRAY[name];
            }
        }
        for (let name in Memory.flags) {
            if (!Game.flags[name]) {
                delete Memory.flags[name];
            }
        }
        let buggedCreep = _.filter(Game.creeps, (c) => !c.memory.role);
        for (let key in buggedCreep) {
            buggedCreep[key].memory.recycle = true;
        }
    }
};

function cleanPathCacheByUsage() {
    if (Memory._pathCache) { //1500 entries ~= 100kB
        if (_.size(Memory._pathCache) > (Memory.myRooms.length * 100)) {
            let sorted = _.sortBy(Memory._pathCache, 'uses');
            let overage = (_.size(Memory._pathCache) - Memory.myRooms.length * 100) + 50;
            log.i('Cleaning Path cache (Over max size by ' + overage + ')...');
            Memory._pathCache = _.slice(sorted, overage, _.size(Memory._pathCache));
        }
    }
}

function cleanRouteCacheByUsage() {
    if (Memory._routeCache && _.size(Memory._routeCache) > (Memory.myRooms.length * 20)) { //1500 entries ~= 100kB
        let sorted = _.sortBy(Memory._routeCache, 'uses');
        let overage = (_.size(Memory._routeCache) - (Memory.myRooms.length * 20)) + 5;
        log.i('Cleaning Route cache (Over max size by ' + overage + ')...');
        Memory._routeCache = _.slice(sorted, overage, _.size(Memory._routeCache));
    }
}

function cleanRouteCacheByAge() {
    if (Memory._routeCache) { //1500 entries ~= 100kB
        let originalCount = Memory._routeCache.length;
        let cache = Memory._routeCache;
        for (let key in cache) {
            if (cache[key].tick + 6000 < Game.time) {
                delete cache[key];
            }
        }
        let prunedCount = originalCount - cache.length;
        if (prunedCount) log.i('Cleaning Route cache (Removed ' + prunedCount + ' old routes.)');
        Memory._routeCache = cache;
    }
}

function cleanDistanceCacheByUsage() {
    if (Memory._distanceCache) {  //1500 entries ~= 100kB
        let cache;
        try {
            cache = JSON.parse(Memory._distanceCache);
        } catch (e) {
            return delete Memory._distanceCache;
        }
        if (_.size(cache) < 5000) return;
        let sorted = _.sortBy(Memory._distanceCache, 'uses');
        let overage = (_.size(Memory._distanceCache) - 2000) + 250;
        log.i('Cleaning Distance cache (Over max size by ' + overage + ')...');
        Memory._distanceCache = _.slice(sorted, overage, _.size(Memory._distanceCache));
    }
}

function cleanConstructionSites() {
    for (let key in Game.constructionSites) {
        if (Math.random() > 0.5 && (!Game.constructionSites[key].room || !Game.constructionSites[key].pos.findClosestByRange(FIND_MY_CREEPS)) &&
            Game.constructionSites[key].structureType !== STRUCTURE_SPAWN && Game.constructionSites[key].structureType !== STRUCTURE_EXTENSION && Game.constructionSites[key].structureType !== STRUCTURE_CONTAINER) {
            Game.constructionSites[key].remove();
        }
    }
}

function cleanRoomIntel() {
    if (Memory.roomCache) {
        let startLength = _.size(Memory.roomCache);
        for (let key in Memory.roomCache) {
            let cutoff = 3000;
            if (Memory.roomCache[key].important) cutoff = 5000;
            if (Memory.roomCache[key].cached + cutoff < Game.time) delete Memory.roomCache[key];
        }
        if (startLength > _.size(Memory.roomCache)) log.d('CleanUp: Room Cache now has ' + _.size(Memory.roomCache) + ' entries.')
    }
    for (let key in Memory.rooms) {
        if (!Game.rooms[key]) delete Memory.rooms[key];
    }
}

function cleanStructureMemory() {
    if (Memory.structureMemory) {
        Memory.structureMemory = undefined;
    } else if (Memory.myRooms.length) {
        for (let room of Memory.myRooms) {
            if (Game.rooms[room].memory.structureMemory) {
                for (let structure of Object.keys(Game.rooms[room].memory.structureMemory)) {
                    if (!Game.getObjectById(structure)) Game.rooms[room].memory.structureMemory[structure] = undefined;
                }
            }
        }
    }
}