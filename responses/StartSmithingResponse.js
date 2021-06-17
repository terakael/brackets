class StartSmithingResponse {    
    constructor() {
        this.action = "start_smith";
    }

    process(obj) {
        Game.ChatBox.add("you put the ore in the furnace...");
    }
}

ResponseController.register(new StartSmithingResponse());