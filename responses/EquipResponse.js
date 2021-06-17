class EquipResponse {    
    constructor() {
        this.action = "invupdate";
    }

    process(obj) {
        Game.Room.player.setEquippedSlots(obj.equippedSlots);
        Game.Room.player.setBonuses(obj.bonuses);
        Game.Room.player.setEquipAnimations(obj.equipAnimations);
    }
}

ResponseController.register(new EquipResponse());