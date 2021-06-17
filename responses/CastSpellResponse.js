class CastSpellResponse {    
    constructor() {
        this.action = "cast_spell";
    }

    process(obj) {
        const {targetId, targetType, playerId, spriteFrameId} = obj;

        const caster = Game.Room.getPlayerById(playerId);
        const target = (targetType === "npc") 
            ? Game.Room.getNpcById(targetId) 
            : Game.Room.getPlayerById(targetId);
        
        if (target && caster) {
            let spell = new Game.Spell(caster, target, spriteFrameId);
            Game.Room.spells.push(spell);

            if (target === Game.currentPlayer)
                Game.ChatBox.add(`${caster.name} is casting magic on you!`, "#fff");
        }
    }
}

ResponseController.register(new CastSpellResponse());