class SceneryDespawnResponse {    
    constructor() {
        this.action = "scenery_despawn";
    }

    process(obj) {
        Game.Room.sceneryInstancesBySceneryId.forEach((value, key, map) => {
            const index = value.indexOf(obj.tileId);
            if (index != -1) {
                value.splice(index, 1);
                Game.Room.loadSceneryInstances([], []);
                return;
            }
        });
        
    }
}

ResponseController.register(new SceneryDespawnResponse());