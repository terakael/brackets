class BankResponse {    
    constructor() {
        this.action = "bank";
    }

    process(obj) {
        Game.activeUiWindow = new Game.BankWindow(Game.worldCameraRect, obj.items, "the bank");
    }
}

ResponseController.register(new BankResponse());