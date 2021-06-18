class FinishCookingResponse {    
    constructor() {
        this.action = "finish_cooking";
    }

    process(obj) {

    }
}

ResponseController.register(new FinishCookingResponse());