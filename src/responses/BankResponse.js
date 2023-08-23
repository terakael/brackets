class BankResponse {    
    constructor() {
        this.action = "bank";
    }

    process(obj) {
        // Game.activeUiWindow = new Game.BankWindow(Game.worldCameraRect, obj.items, obj.tileId, "the bank");

        const {name, tileId, items} = obj;
        Game.activeUiWindow = new Storage(Game.worldCameraRect, "the bank", tileId, items, "storage");
    }
}

ResponseController.register(new BankResponse());