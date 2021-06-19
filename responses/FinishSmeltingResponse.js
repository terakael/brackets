class FinishSmeltingResponse {    
    constructor() {
        this.action = "finish_smelt";
    }

    process(obj) {

    }
}

ResponseController.register(new FinishSmeltingResponse());