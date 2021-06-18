class PlayerEnterResponse {    
    constructor() {
        this.action = "playerEnter";
    }

    process(obj) {
        ChatBox.add(`${obj.name} has logged in.`, "#0ff");
    }
}

ResponseController.register(new PlayerEnterResponse());