class PvmStartResponse {    
    constructor() {
        this.action = "pvm_start";
    }

    process(obj) {
        const {playerId, monsterId, tileId} = obj;

        const player = Game.Room.getPlayerById(playerId);
        const monster = Game.Room.getNpcById(monsterId);

        if (player !== null && monster !== null) {
            player.inCombat = true;
            player.setDestPosAndSpeedByTileId(tileId, -8);
            
            monster.inCombat = true;
            monster.setDestPosAndSpeedByTileId(tileId);
        }
    }
}

ResponseController.register(new PvmStartResponse());