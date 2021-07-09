class DuelResponse {    
    constructor() {
        this.action = "duel";
    }

    process(obj) {
        const fighter1 = Game.Room.getPlayerById(obj.fighter1id);
        const fighter2 = Game.Room.getPlayerById(obj.fighter2id);

        if (fighter1 && fighter2)
            Game.FightManager.addFight(fighter1, fighter2);
    }
}

ResponseController.register(new DuelResponse());