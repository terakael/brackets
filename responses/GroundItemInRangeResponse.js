class GroundItemInRangeResponse {    
    constructor() {
        this.action = "ground_item_in_range";
    }

    process(obj) {
        for (let tileId in obj.groundItems) {
            for (let i = 0; i < obj.groundItems[tileId].length; ++i)
                Game.Room.groundItems.push(new GroundItem(tileId, obj.groundItems[tileId][i]))
        }
    }
}

ResponseController.register(new GroundItemInRangeResponse());