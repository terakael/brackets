class FinishFishingResponse {    
    constructor() {
        this.action = "finish_fishing";
    }

    process(obj) {
    }
}

ResponseController.register(new FinishFishingResponse());