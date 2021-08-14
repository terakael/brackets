class ShowConstructionSkillWindowResponse {    
    constructor() {
        this.action = "show_construction_skill_window";
    }

    process(obj) {
        Game.activeUiWindow = new ConstructionSkillWindow(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new ShowConstructionSkillWindowResponse());