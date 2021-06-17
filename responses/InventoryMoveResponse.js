class InventoryMoveResponse {    
    constructor() {
        this.action = "invmove";
    }

    process(obj) {
        Game.Room.player.updateInventory(obj.inventory);
        Game.Room.player.setEquippedSlots(obj.equippedSlots);
    }
}

ResponseController.register(new InventoryMoveResponse());