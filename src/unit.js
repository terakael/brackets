// a unit is an abstract superclass for npcs and players
// a unit has an inventory and stats, as well as a sprite with the following animations:
// walkup, walkdown, walkleft, walkright, fight, idle

(function() {
    function Unit() {
        
    };
    Unit.prototype = {
        constructor: Unit,
//        stats: new Stats(),
//        inventory: new Inventory(),
//        sprite: new Sprite({
//            walkUp: {x: 0, y: 0, w: 32, h: 32, frames: 3, loopStyle: "pingpong"},// loopStyle e.g. 1, 2, 3, 2, 1, 2, 3, 2, 1 etc
//            walkDown: {x: 0, y: 32, w: 32, h: 32, frames: 3, loopStyle: "pingpong"},
//            walkRight: {x: 0, y: 64, w: 32, h: 32, frames: 3, loopStyle: "pingpong"},// walkleft is flipped from walkright
//            fight: {x: 0, y: 96, w: 32, h: 32, frames: 5, loopStyle: "normal"}// loopStyle e.g. 1, 2, 3, 4, 5, 1, 2, 3, 4, 5 etc
//        })
    };
    
    Game.Unit = Unit;
})();