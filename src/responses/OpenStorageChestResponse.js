class OpenStorageChestResponse {    
    constructor() {
        this.action = "open_storage_chest";
    }

    process(obj) {
        const {name, tileId, items} = obj;
        Game.activeUiWindow = new Storage(Game.worldCameraRect, name, tileId, items, "storage");
    }
}

ResponseController.register(new OpenStorageChestResponse());