class AddGroundTextureInstancesResponse {    
    constructor() {
        this.action = "add_ground_texture_instances";
    }

    process(obj) {
        for (const [key, value] of Object.entries(obj.instances)) {
            for (let i = 0; i < value.length; ++i) {
                Game.Room.groundTextureInstances.set(value[i], key); // tileId, groundTextureId
            }
        }

        Game.Room.drawableTextureInstances = [];

        let ordered = new Map([...Game.Room.groundTextureInstances.entries()].sort());
        for (const [key, value] of ordered.entries()) {
            Game.Room.drawableTextureInstances.push(Number(value));
        }

        Game.Room.updateGroundTextures();
    }
}

ResponseController.register(new AddGroundTextureInstancesResponse());