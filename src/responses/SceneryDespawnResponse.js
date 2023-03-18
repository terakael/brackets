class SceneryDespawnResponse {    
    constructor() {
        this.action = "scenery_despawn";
    }

    process(obj) {
        const {
            sceneryId,
            tileId
        } = obj;

        const index = Game.Room.sceneryInstancesBySceneryId.get(String(sceneryId)).indexOf(tileId);
        if (index != -1) {
            Game.Room.sceneryInstancesBySceneryId.get(String(sceneryId)).splice(index, 1);
            Game.Room.loadSceneryInstances([], []);
            return;
        }
    }
}

ResponseController.register(new SceneryDespawnResponse());