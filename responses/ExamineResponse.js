class ExamineResponse {    
    constructor() {
        this.action = "examine";
    }

    process(obj) {
        Game.ChatBox.add(obj.examineText, "#fff");
    }
}

ResponseController.register(new ExamineResponse());