class ShowMiningSkillWindowResponse {    
    constructor() {
        this.action = "show_mining_skill_window";
    }

    process(obj) {
        Game.activeUiWindow = new MiningSkillWindow(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new ShowMiningSkillWindowResponse());