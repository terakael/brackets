class PvmEndResponse {    
    constructor() {
        this.action = "pvm_end";
    }

    process(obj) {
        const {playerId, monsterId, playerTileId, monsterTileId} = obj;

        Game.Room.playerById(playerId, p => {
            p.setInCombat(false);
            p.setDestPosAndSpeedByTileId(playerTileId);
        });
        
        Game.Room.npcById(monsterId, m => {
            m.inCombat = false;
            m.setDestPosAndSpeedByTileId(monsterTileId);
        });
    }
}

ResponseController.register(new PvmEndResponse());