class DepositResponse {    
    constructor() {
        this.action = "deposit";
    }

    process(obj) {
        Game.activeUiWindow.updateStock(obj.items);
        Game.activeUiWindow.onResize(Game.worldCameraRect);
    }
}

ResponseController.register(new DepositResponse());