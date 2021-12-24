class UpdateGameTimeResponse {    
    constructor() {
        this.action = "update_game_time";
    }

    process(obj) {
        Game.time = obj.time;
    }
}

ResponseController.register(new UpdateGameTimeResponse());