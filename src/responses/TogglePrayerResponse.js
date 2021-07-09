class TogglePrayerResponse {    
    constructor() {
        this.action = "toggle_prayer";
    }

    process(obj) {
        Game.HUD.setActivePrayers(obj.activePrayers);
    }
}

ResponseController.register(new TogglePrayerResponse());