class PlayerOutOfRangeResponse {    
    constructor() {
        this.action = "player_out_of_range";
    }

    process(obj) {
        Game.Room.otherPlayers = Game.Room.otherPlayers.filter(e => !obj.playerIds.includes(e.id));
    }
}

ResponseController.register(new PlayerOutOfRangeResponse());