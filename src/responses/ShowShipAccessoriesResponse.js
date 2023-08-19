class ShowShipAccessoriesResponse {    
    constructor() {
        this.action = "show_ship_accessories";
    }

    process(obj) {
        Game.activeUiWindow = new ShipAccessoriesWindow(Game.worldCameraRect, obj.accessories, obj.tileId);
    }
}

ResponseController.register(new ShowShipAccessoriesResponse());