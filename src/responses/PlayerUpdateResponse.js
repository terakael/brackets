class PlayerUpdateResponse {    
    constructor() {
        this.action = "player_update";
    }

    process(obj) {
        Game.Room.playerById(obj.id, p => p.handlePlayerUpdate(obj));
    }
}

ResponseController.register(new PlayerUpdateResponse());