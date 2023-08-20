class ActionBubbleResponse {    
    constructor() {
        this.action = "action_bubble";
    }

    process(obj) {
        const ship = Game.Room.getShipById(obj.shipId);
        if (ship) {
            ship.setActionBubble(obj.iconId, obj.playerId);
        }
        else {
            Game.Room.playerById(obj.playerId, p => p.setActionBubble(obj.iconId));
        }
    }
}

ResponseController.register(new ActionBubbleResponse());