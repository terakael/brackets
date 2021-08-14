class ShowMagicSkillWindowResponse {    
    constructor() {
        this.action = "show_magic_skill_window";
    }

    process(obj) {
        Game.activeUiWindow = new MagicSkillWindow(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new ShowMagicSkillWindowResponse());