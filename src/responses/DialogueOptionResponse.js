class DialogueOptionResponse {    
    constructor() {
        this.action = "show_dialogue_options";
    }

    process(obj) {
        Game.activeUiWindow = new DialogueOptionWindow(Game.worldCameraRect, obj.options);
    }
}

ResponseController.register(new DialogueOptionResponse());