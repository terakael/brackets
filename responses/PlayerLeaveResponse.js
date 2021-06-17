class PlayerLeaveResponse {    
    constructor() {
        this.action = "playerLeave";
    }

    process(obj) {
        Game.ChatBox.add(`${obj.name} has logged out.`, "#0ff");
    }
}

ResponseController.register(new PlayerLeaveResponse());