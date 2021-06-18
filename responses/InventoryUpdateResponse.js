class InventoryUpdateResponse {    
    constructor() {
        this.action = "invupdate";
    }

    process(obj) {
        Game.currentPlayer.updateInventory(obj.inventory);
        Game.currentPlayer.setEquippedSlots(obj.equippedSlots);
    }
}

ResponseController.register(new InventoryUpdateResponse());