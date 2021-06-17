class ToggleAttackStyleResponse {    
    constructor() {
        this.action = "toggle_attack_style";
    }

    process(obj) {
        Game.currentPlayer.setAttackStyle(obj.attackStyleId);
        Game.ChatBox.add(`attack style switched to ${Game.currentPlayer.getCurrentAttackStyle()}.`);
    }
}

ResponseController.register(new ToggleAttackStyleResponse());