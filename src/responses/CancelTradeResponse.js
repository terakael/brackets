class CancelTradeResponse {    
    constructor() {
        this.action = "cancel_trade";
    }

    process(obj) {
        Game.activeUiWindow = null;
    }
}

ResponseController.register(new CancelTradeResponse());