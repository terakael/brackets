class GroundItemRefreshResponse {    
    constructor() {
        this.action = "ground_item_refresh";
    }

    process(obj) {
        Game.Room.refreshGroundItems(obj.groundItems);
    }
}

ResponseController.register(new GroundItemRefreshResponse());