class EquipResponse {    
    constructor() {
        this.action = "equip";
    }

    process(obj) {
        Game.currentPlayer.setEquippedSlots(obj.equippedSlots);
        Game.currentPlayer.setBonuses(obj.bonuses);
        Game.currentPlayer.setEquipAnimations(obj.equipAnimations);
    }
}

ResponseController.register(new EquipResponse());