class CycleBaseAnimationResponse {    
    constructor() {
        this.action = "cycle_base_animation";
    }

    process(obj) {
        if (Game.activeUiWindow instanceof BaseAnimationsWindow) {
            Game.activeUiWindow.cycleAnimation(obj.type, obj.animation);
        }
    }
}

ResponseController.register(new CycleBaseAnimationResponse());