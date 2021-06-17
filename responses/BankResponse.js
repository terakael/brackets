class BankResponse {    
    constructor() {
        this.action = "show_stat_window";
    }

    process(obj) {
        Game.activeUiWindow = new Game.BankWindow(Game.worldCameraRect, obj.items, "the bank");
    }
}

ResponseController.register(new BankResponse());