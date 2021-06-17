class TradeUpdateResponse {    
    constructor() {
        this.action = "trade_update";
    }

    process(obj) {
        if (Game.activeUiWindow.type !== "trade") {
            Game.activeUiWindow = null;
            return;
        }

        Game.activeUiWindow.update(obj);
    }
}

ResponseController.register(new TradeUpdateResponse());