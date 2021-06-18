class InventoryMoveResponse {    
    constructor() {
        this.action = "invmove";
    }

    process(obj) {
        Game.currentPlayer.updateInventory(obj.inventory);
        Game.currentPlayer.setEquippedSlots(obj.equippedSlots);
    }
}

ResponseController.register(new InventoryMoveResponse());