class StatBoostsResponse {    
    constructor() {
        this.action = "stat_boosts";
    }

    process(obj) {
        Game.currentPlayer.stats.setBoosts(obj.boosts);
    }
}

ResponseController.register(new StatBoostsResponse());