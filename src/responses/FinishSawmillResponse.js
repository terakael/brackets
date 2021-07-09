class FinishSawmillResponse {    
    constructor() {
        this.action = "finish_sawmill";
    }

    process(obj) {

    }
}

ResponseController.register(new FinishSawmillResponse());