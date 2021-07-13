class PvmStartResponse {    
    constructor() {
        this.action = "pvm_start";
    }

    process(obj) {
        console.log(obj);
        const {playerId, monsterId, tileId} = obj;

        const player = Game.Room.getPlayerById(playerId);
        const monster = Game.Room.getNpcById(monsterId);

        if (player !== undefined && monster !== undefined) {
            player.inCombat = true;
            player.setDestPosAndSpeedByTileId(tileId, -8);
            
            monster.inCombat = true;
            monster.setDestPosAndSpeedByTileId(tileId);
        }
    }
}

ResponseController.register(new PvmStartResponse());