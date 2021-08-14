class ShowFishingSkillWindowResponse {    
    constructor() {
        this.action = "show_fishing_skill_window";
    }

    process(obj) {
        Game.activeUiWindow = new FishingSkillWindow(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new ShowFishingSkillWindowResponse());