class LoadPrayersResponse {    
    constructor() {
        this.action = "load_prayers";
    }

    process(obj) {
        Game.HUD.loadPrayers(obj.prayers);
    }
}

ResponseController.register(new LoadPrayersResponse());