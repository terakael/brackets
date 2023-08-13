class ShipInRangeResponse {    
    constructor() {
        this.action = "ship_in_range";
    }

    process(obj) {
        for (let i = 0; i < obj.ships.length; ++i) {
            Game.Room.ships.push(new Game.Ship(obj.ships[i]));
        }
    }
}

ResponseController.register(new ShipInRangeResponse());