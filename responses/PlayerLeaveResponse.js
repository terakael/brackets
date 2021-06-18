class PlayerLeaveResponse {    
    constructor() {
        this.action = "playerLeave";
    }

    process(obj) {
        ChatBox.add(`${obj.name} has logged out.`, "#0ff");
    }
}

ResponseController.register(new PlayerLeaveResponse());