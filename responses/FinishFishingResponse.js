class FinishFishingResponse {    
    constructor() {
        this.action = "finish_fishing";
    }

    process(obj) {
        Game.ws.send({
            action: "fish",
            tileId: obj.tileId
        });
    }
}

ResponseController.register(new FinishFishingResponse());