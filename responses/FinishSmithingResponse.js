class FinishSmithingResponse {    
    constructor() {
        this.action = "finish_smith";
    }

    process(obj) {
        Game.ws.send({
            action: "smith",
            itemId: obj.itemId
        });
    }
}

ResponseController.register(new FinishSmithingResponse());