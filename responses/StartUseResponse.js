class StartUseResponse {    
    constructor() {
        this.action = "start_use";
    }

    process(obj) {
    }
}

ResponseController.register(new StartUseResponse());