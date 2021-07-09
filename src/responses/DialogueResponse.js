class DialogueResponse {    
    constructor() {
        this.action = "dialogue";
    }

    process(obj) {
        Game.activeUiWindow = obj.dialogue === "" ? null : new Game.DialogueWindow(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new DialogueResponse());