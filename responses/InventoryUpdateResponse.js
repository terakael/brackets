class InventoryUpdateResponse {    
    constructor() {
        this.action = "invupdate";
    }

    process(obj) {
        Game.Room.player.updateInventory(obj.inventory);
        Game.Room.player.setEquippedSlots(obj.equippedSlots);
    }
}

ResponseController.register(new InventoryUpdateResponse());