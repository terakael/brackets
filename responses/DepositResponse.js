class DepositResponse {    
    constructor() {
        this.action = "deposit";
    }

    process(obj) {
        if (Game.activeUiWindow) {
            // if you deposit and then close the window too quickly then the window is null at this point
            // no need to update
            Game.activeUiWindow.updateStock(obj.items);
            Game.activeUiWindow.onResize(Game.worldCameraRect);
        }
    }
}

ResponseController.register(new DepositResponse());