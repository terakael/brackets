class EquipResponse {    
    constructor() {
        this.action = "equip";
    }

    process(obj) {
        Game.currentPlayer.setEquippedSlots(obj.equippedSlots);
        Game.currentPlayer.setBonuses(obj.bonuses);
    }
}

ResponseController.register(new EquipResponse());