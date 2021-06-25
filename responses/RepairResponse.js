class RepairResponse {    
    constructor() {
        this.action = "repair";
    }

    process(obj) {

    }
}

ResponseController.register(new RepairResponse());