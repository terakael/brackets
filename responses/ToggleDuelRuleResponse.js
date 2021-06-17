class ToggleDuelRuleResponse {    
    constructor() {
        this.action = "toggle_duel_rule";
    }

    process(obj) {
        if (Game.activeUiWindow.type === "trade") {
            Game.activeUiWindow.setDuelRules(obj);
        }
    }
}

ResponseController.register(new ToggleDuelRuleResponse());