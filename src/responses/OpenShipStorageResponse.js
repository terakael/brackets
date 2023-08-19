class OpenShipStorageResponse {    
    constructor() {
        this.action = "storage";
    }

    process(obj) {
        const {name, tileId, items} = obj;
        Game.activeUiWindow = new Storage(Game.worldCameraRect, name, tileId, items, "storage");
    }
}

ResponseController.register(new OpenShipStorageResponse());