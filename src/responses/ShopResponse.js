class ShopResponse {    
    constructor() {
        this.action = "show_shop";
    }

    process(obj) {
        Game.activeUiWindow = new Game.ShopWindow(Game.worldCameraRect, obj.shopStock, obj.shopName);
    }
}

ResponseController.register(new ShopResponse());