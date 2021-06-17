class WithdrawResponse {    
    constructor() {
        this.action = "withdraw";
    }

    process(obj) {
        Game.activeUiWindow.updateStock(obj.items);
        Game.activeUiWindow.onResize(Game.worldCameraRect);
    }
}

ResponseController.register(new WithdrawResponse());