class ShipUpdateResponse {    
    constructor() {
        this.action = "ship_update";
    }

    process(obj) {
        Game.Room.shipById(obj.captainId, ship => ship.handleUpdate(obj));
    }
}

ResponseController.register(new ShipUpdateResponse());