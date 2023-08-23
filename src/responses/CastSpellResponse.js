class CastSpellResponse {    
    constructor() {
        this.action = "cast_spell";
    }

    process(obj) {
        const {targetId, targetType, sourceTileId, spriteFrameId, lifetime} = obj;

        let target = null;
        switch (targetType) {
            case "npc":
                target = Game.Room.getNpcById(targetId);
                break;
            case "player":
                target = Game.Room.getPlayerById(targetId);
                break;
            case "ship":
                target = Game.Room.getShipById(targetId);
                break;
        }
        
        if (target) {
            let spell = new Game.Spell(sourceTileId, target, spriteFrameId, lifetime);
            Game.Room.spells.push(spell);

            if (target === Game.currentPlayer)
                ChatBox.add(`${caster.name} is casting magic on you!`, "#fff");
        }
    }
}

ResponseController.register(new CastSpellResponse());