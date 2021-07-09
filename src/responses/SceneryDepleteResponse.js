class SceneryDepleteResponse {    
    constructor() {
        this.action = "scenery_deplete";
    }

    process(obj) {
        console.log("deplete");
        console.log(obj);
        const xy = tileIdToXY(obj.tileId);
        const sceneryInstances = Game.Room.sceneryInstances.get(xy.y);
        for (let i = 0; i < sceneryInstances.length; ++i) {
            if (sceneryInstances[i].tileId === obj.tileId) {
                sceneryInstances[i].sprite[0].currentFrame = 1;
                break;
            }
        }
    }
}

ResponseController.register(new SceneryDepleteResponse());