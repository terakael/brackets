class AddSceneryInstancesResponse {    
    constructor() {
        this.action = "add_scenery_instances";
    }

    process(obj) {
        for (const [sceneryId, tileIds] of Object.entries(obj.instances)) {
            Game.Room.sceneryInstancesBySceneryId.set(sceneryId, tileIds.concat(Game.Room.sceneryInstancesBySceneryId.get(sceneryId) || []));
        }
        Game.Room.loadSceneryInstances(obj.depletedScenery, obj.openDoors);
        Game.Room.addSceneryToCanvas(Game.Room.sceneryInstancesBySceneryId);
    }
}

ResponseController.register(new AddSceneryInstancesResponse());