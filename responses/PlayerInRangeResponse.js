class PlayerInRangeResponse {    
    constructor() {
        this.action = "player_in_range";
    }

    process(obj) {
        for (let i = 0; i < obj.players.length; ++i) {
            Game.Room.addPlayer(obj.players[i]);
        }
    }
}

ResponseController.register(new PlayerInRangeResponse());