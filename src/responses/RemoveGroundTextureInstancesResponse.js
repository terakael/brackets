class RemoveGroundTextureInstancesResponse {    
    constructor() {
        this.action = "remove_ground_texture_instances";
    }

    process(obj) {
        for (let i = 0; i < obj.tileIds.length; ++i) {
            Game.Room.groundTextureInstances.delete(obj.tileIds[i]);

            for (let [sceneryId, tileIdList] of Game.Room.sceneryInstancesBySceneryId) {
                let index = tileIdList.indexOf(obj.tileIds[i]);
                if (index != -1)
                    tileIdList.splice(index, 1);
            }
        }
    }
}

ResponseController.register(new RemoveGroundTextureInstancesResponse());