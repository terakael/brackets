class ShowWoodcuttingSkillWindowResponse {    
    constructor() {
        this.action = "show_woodcutting_skill_window";
    }

    process(obj) {
        Game.activeUiWindow = new WoodcuttingSkillWindow(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new ShowWoodcuttingSkillWindowResponse());