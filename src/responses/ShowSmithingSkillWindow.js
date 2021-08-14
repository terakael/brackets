class ShowSmithingSkillWindowResponse {    
    constructor() {
        this.action = "show_smithing_skill_window";
    }

    process(obj) {
        Game.activeUiWindow = new SmithingSkillWindow(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new ShowSmithingSkillWindowResponse());