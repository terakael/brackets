class GroundItemOutOfRangeResponse {    
    constructor() {
        this.action = "ground_item_out_of_range";
    }

    process(obj) {
        for (let tileId in obj.groundItems) {
            for (let j = 0; j < obj.groundItems[tileId].length; ++j) {   
                for (let i = 0; i < Game.Room.groundItems.length; ++i) {
                    if (Game.Room.groundItems[i].tileId === tileId && Game.Room.groundItems[i].item.id === obj.groundItems[tileId][j]) {
                        Game.Room.groundItems.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }
}

ResponseController.register(new GroundItemOutOfRangeResponse());