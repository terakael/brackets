class ShowCookingSkillWindowResponse {    
    constructor() {
        this.action = "show_cooking_skill_window";
    }

    process(obj) {
        Game.activeUiWindow = new CookingSkillWindow(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new ShowCookingSkillWindowResponse());