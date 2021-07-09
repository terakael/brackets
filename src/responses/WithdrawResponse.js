class WithdrawResponse {    
    constructor() {
        this.action = "withdraw";
    }

    process(obj) {
        if (Game.activeUiWindow) {
            // sometimes the player can withdraw quickly and then close the window before the response comes.
            // in this case we don't need/want to update the ui window.
            Game.activeUiWindow.updateStock(obj.items);
            Game.activeUiWindow.onResize(Game.worldCameraRect);
        }
    }
}

ResponseController.register(new WithdrawResponse());