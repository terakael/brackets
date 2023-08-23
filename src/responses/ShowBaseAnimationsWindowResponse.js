class ShowBaseAnimationsWindowResponse {    
    constructor() {
        this.action = "show_base_animations_window";
    }

    process(obj) {
        Game.activeUiWindow = new BaseAnimationsWindow(Game.worldCameraRect, obj.baseAnimations, obj.customizableAnimations, obj.palette);
    }
}

ResponseController.register(new ShowBaseAnimationsWindowResponse());