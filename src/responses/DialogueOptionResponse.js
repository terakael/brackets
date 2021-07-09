class DialogueOptionResponse {    
    constructor() {
        this.action = "dialogue_option";
    }

    process(obj) {
        Game.activeUiWindow = new Game.DialogueOptionWindow(Game.worldCameraRect, obj.options);
    }
}

ResponseController.register(new DialogueOptionResponse());