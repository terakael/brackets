class FinishSmithingResponse {    
    constructor() {
        this.action = "finish_smith";
    }

    process(obj) {

    }
}

ResponseController.register(new FinishSmithingResponse());