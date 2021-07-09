class PlayerEnterResponse {    
    constructor() {
        this.action = "player_enter";
    }

    process(obj) {
        ChatBox.add(`${obj.name} has logged in.`, "#0ff");
    }
}

ResponseController.register(new PlayerEnterResponse());