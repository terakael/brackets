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
            SpriteManager.loadGroundTextures(resource.groundTextures);

        if (resource.scenery)
            for (let i = 0; i < resource.scenery.length; ++i)
                Game.sceneryMap.set(resource.scenery[i].id, resource.scenery[i]);
        
        if (resource.npcs)
            Game.Room.loadNpcs(resource.npcs);

        SpriteManager.loadSpriteMaps(resource.spriteMaps).done(function() {
            if (resource.groundTextureSpriteMaps) {
                Game.Room.loadTextureMaps(resource.groundTextureSpriteMaps).done(function() {
                    Game.Room.saveGroundTexturesToCanvas();
                });
            }
        });
    }
}

ResponseController.register(new AddResourcesResponse());