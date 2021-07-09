class AcceptTradeResponse {    
    constructor() {
        this.action = "accept_trade";
    }

    process(obj) {
        const {otherPlayerId, duelRules} = obj;
                        
        const player = Game.Room.getPlayerById(otherPlayerId);
        if (player) {
            Game.activeUiWindow = new Game.TradeWindow(Game.worldCameraRect, player.name, duelRules); // duelRules is null if it's not a duel
        }
    }
}

ResponseController.register(new AcceptTradeResponse());