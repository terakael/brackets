class ShipOutOfRangeResponse {    
    constructor() {
        this.action = "ship_out_of_range";
    }

    process(obj) {
        Game.Room.ships = Game.Room.ships.filter(e => !obj.instances.includes(e.instanceId));
    }
}

ResponseController.register(new ShipOutOfRangeResponse());