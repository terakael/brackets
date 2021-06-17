class CatchResponse {    
    constructor() {
        this.action = "catch";
    }

    process(obj) {
        Game.Room.npcs = Game.Room.npcs.filter(e => e.instanceId !== obj.instanceId);
    }
}

ResponseController.register(new CatchResponse());