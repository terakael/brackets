class ConstructableInRangeResponse {    
    constructor() {
        this.action = "constructable_in_range";
    }

    process(obj) {
        for (const [constructableId, tileIds] of Object.entries(obj.instances)) {
            Game.Room.constructableInstancesById.set(constructableId, tileIds.concat(Game.Room.constructableInstancesById.get(constructableId) || []));
        }
        Game.Room.loadSceneryInstances([], []);
        // Game.Room.addSceneryToCanvas(Game.Room.sceneryInstancesBySceneryId);
    }
}

ResponseController.register(new ConstructableInRangeResponse());