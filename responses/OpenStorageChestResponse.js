class OpenStorageChestResponse {    
    constructor() {
        this.action = "open_storage_chest";
    }

    process(obj) {
        const {slotCount, items, tileId} = obj;
        Game.activeUiWindow = new Storage(Game.worldCameraRect, slotCount, tileId, items);
    }
}

ResponseController.register(new OpenStorageChestResponse());