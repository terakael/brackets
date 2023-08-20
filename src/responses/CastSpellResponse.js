class CastSpellResponse {    
    constructor() {
        this.action = "cast_spell";
    }

    process(obj) {
        const {targetId, targetType, sourceTileId, spriteFrameId} = obj;

        const target = (targetType === "npc") 
            ? Game.Room.getNpcById(targetId) 
            : Game.Room.getPlayerById(targetId);
        
        if (target) {
            let spell = new Game.Spell(sourceTileId, target, spriteFrameId);
            Game.Room.spells.push(spell);

            if (target === Game.currentPlayer)
                ChatBox.add(`${caster.name} is casting magic on you!`, "#fff");
        }
    }
}

ResponseController.register(new CastSpellResponse());