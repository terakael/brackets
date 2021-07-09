class ExamineResponse {    
    constructor() {
        this.action = "examine";
    }

    process(obj) {
        ChatBox.add(obj.examineText, "#fff");
    }
}

ResponseController.register(new ExamineResponse());