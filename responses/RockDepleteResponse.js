class RockDepleteResponse {    
    constructor() {
        this.action = "rock_deplete";
    }

    process(obj) {
        const xy = tileIdToXY(obj.tileId);
        const sceneryInstances = Game.Room.sceneryInstances.get(xy.y);
        for (let i = 0; i < sceneryInstances.length; ++i) {
            if (sceneryInstances[i].tileId === obj.tileId) {
                sceneryInstances[i].sprite[0].nextFrame();
                break;
            }
        }
    }
}

ResponseController.register(new RockDepleteResponse());