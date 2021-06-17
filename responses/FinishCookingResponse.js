class FinishCookingResponse {    
    constructor() {
        this.action = "finish_cooking";
    }

    process(obj) {
        const {itemId, tileId, type} = obj;
        Game.ws.send({
            action: "use",
            src: itemId,
            dest: tileId,
            type
        });
    }
}

ResponseController.register(new FinishCookingResponse());