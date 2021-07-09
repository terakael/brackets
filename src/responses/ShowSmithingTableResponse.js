class ShowSmithingTableResponse {    
    constructor() {
        this.action = "show_smithing_table";
    }

    process(obj) {
        Game.activeUiWindow = new Game.UIWindow(Game.worldCameraRect, obj.smithingOptions);
    }
}

ResponseController.register(new ShowSmithingTableResponse());