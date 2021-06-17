class AddExpResponse {    
    constructor() {
        this.action = "addexp";
    }

    process(obj) {
        for (let key in obj["stats"]) {
            Game.Room.player.stats.gainExp(Game.statMap.get(key), obj.stats[key]);
        }
    }
}

ResponseController.register(new AddExpResponse());