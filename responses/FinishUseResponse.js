class FinishUseResponse {    
    constructor() {
        this.action = "finish_use";
    }

    process(obj) {

    }
}

ResponseController.register(new FinishUseResponse());