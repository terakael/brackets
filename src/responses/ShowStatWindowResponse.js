class ShowStatWindowResponse {    
    constructor() {
        this.action = "show_stat_window";
    }

    process(obj) {
        if (obj.statId === 8) {// potions
            Game.activeUiWindow = new Game.PotionWindow(Game.worldCameraRect, obj.rows, "potions");
        }
    }
}

ResponseController.register(new ShowStatWindowResponse());