class ActionBubbleResponse {    
    constructor() {
        this.action = "action_bubble";
    }

    process(obj) {
        Game.Room.playerById(obj.playerId, p => p.setActionBubble(obj.iconId));
    }
}

ResponseController.register(new ActionBubbleResponse());