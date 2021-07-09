class AddExpResponse {    
    constructor() {
        this.action = "addexp";
    }

    process(obj) {
        const {stats} = obj;
        for (let key in stats) {
            Game.currentPlayer.stats.gainExp(Game.statMap.get(key), stats[key]);
        }
    }
}

ResponseController.register(new AddExpResponse());