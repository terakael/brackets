class ShowArtisanShopResponse {    
    constructor() {
        this.action = "show_artisan_shop";
    }

    process(obj) {
        Game.activeUiWindow = new ArtisanShop(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new ShowArtisanShopResponse());