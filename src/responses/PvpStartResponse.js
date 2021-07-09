class PvpStartResponse {    
    constructor() {
        this.action = "pvp_start";
    }

    process(obj) {
        const {player1Id, player2Id, tileId} = obj;

        const player1 = Game.Room.getPlayerById(player1Id);
        const player2 = Game.Room.getPlayerById(player2Id);
        
        if (player1 !== null && player2 !== null) {
            player1.inCombat = true;
            player1.setDestPosAndSpeedByTileId(tileId, -8);
            
            player2.inCombat = true;
            player2.setDestPosAndSpeedByTileId(tileId, 8);
        }
    }
}

ResponseController.register(new PvpStartResponse());