class OpenResponse {    
    constructor() {
        this.action = "open";
    }

    process(obj) {
        let scenery = null;
        outer:
        for (const [mapKey, sceneryList] of Game.Room.sceneryInstances.entries()) {
            for (let i = 0; i < sceneryList.length; ++i) {
                if (sceneryList[i].tileId === obj.tileId) {
                    scenery = sceneryList[i];
                    sceneryList.splice(i, 1);
                    break outer;
                }
            }
        }

        // need to move it in the map just in case the y changed
        if (scenery) {
            scenery.sprite[0].nextFrame();
            scenery.label = scenery.sprite[0].currentFrame === 1 ? "close " + scenery.name : null;
            let newY = scenery.y + scenery.sprite[0].getBoundingBox().bottom;
            if (!Game.Room.sceneryInstances.has(newY))
                Game.Room.sceneryInstances.set(newY, []);
            Game.Room.sceneryInstances.get(newY).push(scenery);
        }
    }
}

ResponseController.register(new OpenResponse());