class FinishUseResponse {    
    constructor() {
        this.action = "finish_use";
    }

    process(obj) {
        const {src, dest, type} = obj;
        
        Game.ws.send({
            action: "use",
            src,
            dest,
            type
        });
    }
}

ResponseController.register(new FinishUseResponse());