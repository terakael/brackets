class TeleportExplosionResponse {    
    constructor() {
        this.action = "teleport_explosion";
    }

    process(obj) {
        const xy = tileIdToXY(obj.tileId);
        Game.Room.teleportExplosions.push({
            x: xy.x,
            y: xy.y - 16,
            lifetime: 1
        });
    }
}

ResponseController.register(new TeleportExplosionResponse());