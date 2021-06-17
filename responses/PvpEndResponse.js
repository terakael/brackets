class PvpEndResponse {    
    constructor() {
        this.action = "pvp_end";
    }

    process(obj) {
        const {player1Id, player1TileId, player2Id, player2TileId} = obj;

        Game.Room.playerById(player1Id, p => {
            p.setInCombat(false);
            p.setDestPosAndSpeedByTileId(player1TileId);
        });

        Game.Room.playerById(player2Id, p => {
            p.setInCombat(false);
            p.setDestPosAndSpeedByTileId(player2TileId);
        });
    }
}

ResponseController.register(new PvpEndResponse());