class ShowSmithingTableResponse {    
    constructor() {
        this.action = "show_smithing_table";
    }

    process(obj) {
        const {smithingOptions, storedCoal} = obj;
        Game.activeUiWindow = new Game.UIWindow(Game.worldCameraRect, smithingOptions, storedCoal);
    }
}

ResponseController.register(new ShowSmithingTableResponse());