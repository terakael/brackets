class StartFishingResponse {    
    constructor() {
        this.action = "start_fishing";
    }

    process(obj) {
        Game.ChatBox.add("you start fishing...");
    }
}

ResponseController.register(new StartFishingResponse());