class DialogueResponse {    
    constructor() {
        this.action = "show_dialogue";
    }

    process(obj) {
        Game.activeUiWindow = obj.dialogue === "" ? null : new DialogueWindow(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new DialogueResponse());