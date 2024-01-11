class AddResourcesResponse {    
    constructor() {
        this.action = "add_resources";
    }

    process(obj) {
        const resource = obj;
        console.log(resource);
        
        if (resource.spriteFrames)
            SpriteManager.loadSpriteFrames(resource.spriteFrames);

        if (resource.items)
            SpriteManager.loadItems(resource.items);

        if (resource.groundTextures)
            console.log(obj)
            SpriteManager.loadGroundTextures(resource.groundTextures).done((tex) => {
                Game.Room.loadTextureMaps(tex);
            });

        if (resource.scenery)
            for (let i = 0; i < resource.scenery.length; ++i)
                Game.sceneryMap.set(resource.scenery[i].id, resource.scenery[i]);
        
        if (resource.npcs)
            Game.Room.loadNpcs(resource.npcs);

        if (resource.ships)
            Game.Room.loadShips(resource.ships);

        SpriteManager.loadSpriteMaps(resource.spriteMaps);
    }
}

ResponseController.register(new AddResourcesResponse());