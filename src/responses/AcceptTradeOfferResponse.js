class AcceptTradeOfferResponse {    
    constructor() {
        this.action = "accept_trade_offer";
    }

    process(obj) {
        if (Game.activeUiWindow.type === "trade") {
            Game.activeUiWindow.handleAccept(obj)
        }
    }
}

ResponseController.register(new AcceptTradeOfferResponse());