$(function () {
    // prepare our game canvas
    const canvas = document.getElementById("game");
    const context = canvas.getContext("2d");
    
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    Game.boundingRect = canvas.getBoundingClientRect();

    const otherCanvas = document.createElement("canvas");
    otherCanvas.width = canvas.width;
    otherCanvas.height = canvas.height
    Game.otherContext = otherCanvas.getContext("2d");
    
    const resourceWs = new GameWebSocket(Game.ip, Game.resourcePort, "resources", response => {
        const {
            success, 
            action, 
            spriteMaps, 
            spriteFrames, 
            items, 
            contextOptions, 
            statMap, 
            expMap,
            attackStyles
        } = response;
        
        if (success && action === "cached_resources") {
            Game.LogonScreen.loadingText = "loading resources...";
            Game.LogonScreen.draw(context, canvas.width, canvas.height);

            SpriteManager.loadSpriteMaps(spriteMaps).done(function() {
                SpriteManager.loadSpriteFrames(spriteFrames);
                SpriteManager.loadItems(items);
                // Game.Room.loadTextureMaps(spriteMaps.map(e => e.id));
                Game.ContextMenu.loadContextOptions(contextOptions);
                Game.statMap = new Map(Object.entries(statMap));
                Game.expMap = new Map();
                for (let [key, value] of Object.entries(expMap).sort((a, b) => b < a)) {
                    Game.expMap.set(Number(key), Number(value));
                }
                Game.attackStyles = attackStyles;
                Game.LogonScreen.loading = false;
                Game.LogonScreen.loadingText = null;
            });
        }
    });

    resourceWs.ws.onopen = function() {
        const font = new FontFace('customFont', 'url(./font.ttf)');
        font.load().then(function() {
            document.fonts.add(font);
            // get the initial resources for the game (sprite maps, scenery etc)
            resourceWs.send({
                action: "resources",
                id: 0
            });
        });
    };

    resourceWs.ws.onclose = function() {
        console.log("loaded resources");
    };
    
    canvas.addEventListener("mousedown", function (e) {
        if (Game.state === 'game') {
            ChatBox.clearInput(); // e.g. "enter deposit amount: " thing

            // TODO inventory, minimap, stats etc should all be contained within this
            if (Game.HUD.mouseWithin(Game.mousePos)) {
                Game.HUD.onMouseDown(e);
            } 

            if (Game.activeUiWindow) {
                Game.activeUiWindow.onMouseDown(e);
            }
            else if (Game.currentPlayer.inventory.mouseWithin()) {
                // if the player right-clicks on an item near the bottom of the inventory and the context option is off the inventory rect
                // then we still want to handle the mouse click right
                Game.currentPlayer.inventory.onMouseDown(e.button);
            } 
            else if (Game.ContextMenu.active && e.button == 0) {// left
                // selecting a context option within the game world
                Game.ContextMenu.handleMenuSelect();
                Game.currentPlayer.inventory.slotInUse = null;
            }
            else if (Game.Minimap.rect.pointWithin(Game.mousePos)) {
                Game.Minimap.onMouseDown(e.button);
            } 
            else if (Game.currentPlayer.stats.rect.pointWithin(Game.mousePos)) {
                Game.currentPlayer.stats.onMouseDown(e.button);
            }
            else if (Game.worldCameraRect.pointWithin(Game.mousePos)) {
                switch (e.button) {
                    case 0: // left
                        if (!Game.ContextMenu.active && Game.currentPlayer.inventory.slotInUse == null) {
                            if (Game.ContextMenu.leftclickMenuOption == null) {
                                // no stored leftclick option, so just move to the position
                                Game.cursor.handleClick(false);

                                if (Game.ctrlPressed && Game.currentPlayer.id === 3) { // special case for god
                                    let tileId = xyToTileId(~~Game.cursor.mousePos.x, ~~Game.cursor.mousePos.y);
                                    Game.ws.send({
                                        action: "message",
                                        id: Game.currentPlayer.id,
                                        message: `::tele ${tileId}`
                                    });
                                } else {
                                    Game.ws.send({ action: "move", id: Game.currentPlayer.id, x: ~~Game.cursor.mousePos.x, y: ~~Game.cursor.mousePos.y });
                                    Game.Minimap.setPlayerDestXY(~~Game.cursor.mousePos.x, ~~Game.cursor.mousePos.y);
                                }
                            } else {
                                // there's a stored leftclick option so perform the leftclick option
                                Game.cursor.handleClick(true);
                                Game.ws.send(Game.ContextMenu.leftclickMenuOption);
                            }
                        } else if (Game.currentPlayer.inventory.slotInUse != null) {
                            // are we hovering over a player/scenery/npc?
                            let handled = false;
                            Game.Room.drawableSceneryMap.forEach(function(value, key, map) {
                                for (let i in value) {
                                    const boundingBox = value[i].sprite[0].getBoundingBox();
                                    const rect = new Rectangle(
                                        value[i].x + boundingBox.left, 
                                        value[i].y + boundingBox.top, 
                                        boundingBox.width, 
                                        boundingBox.height);
    
                                    const unusable = (value[i].attributes & 1) == 1;
                                    if (rect.pointWithin(Game.cursor.mousePos) && !unusable) {// don't use with walls, fences etc
                                        Game.cursor.handleClick(true);
                                        const tileId = value[i].tileId;
                                        Game.ws.send({
                                            action: "use",
                                            id: Game.currentPlayer.id,
                                            src: Game.currentPlayer.inventory.slotInUse.item.id,
                                            dest: tileId,
                                            type: "scenery",
                                            slot: Game.currentPlayer.inventory.slotInUse.id
                                        });
                                        Game.currentPlayer.inventory.slotInUse = null;
                                        handled = true;
                                        return;
                                    }
                                }
                            });

                            // npc
                            if (!handled) {
                                for (let i = 0; i < Game.Room.npcs.length; ++i) {
                                    const boundingBox = Game.Room.npcs[i].getCurrentSpriteFrame().getBoundingBox();
                                    const rect = new Rectangle(
                                        Game.Room.npcs[i].pos.x + boundingBox.left, 
                                        Game.Room.npcs[i].pos.y + boundingBox.top, 
                                        boundingBox.width, 
                                        boundingBox.height);

                                    if (rect.pointWithin(Game.cursor.mousePos)) {
                                        Game.cursor.handleClick(true);
                                        Game.ws.send({
                                            action: "use",
                                            type: "npc",
                                            id: Game.currentPlayer.id,
                                            src: Game.currentPlayer.inventory.slotInUse.item.id,
                                            slot: Game.currentPlayer.inventory.slotInUse.id,
                                            dest: Game.Room.npcs[i].instanceId
                                        });
                                        Game.currentPlayer.inventory.slotInUse = null;
                                        handled = true;
                                        return;
                                    }
                                }
                            }

                            if (!handled) {
                                for (let i = 0; i < Game.Room.otherPlayers.length; ++i) {
                                    const player = Game.Room.otherPlayers[i];
                                    const boundingBox = player.getCurrentSpriteFrame().getBoundingBox();
                                    const rect = new Rectangle(
                                        player.x + boundingBox.left, 
                                        player.y + boundingBox.top, 
                                        boundingBox.width, 
                                        boundingBox.height);
        
                                    if (rect.pointWithin(Game.cursor.mousePos)) {
                                        Game.cursor.handleClick(true);
                                        Game.ws.send({
                                            action: "use",
                                            type: "player",
                                            id: Game.currentPlayer.id,
                                            src: Game.currentPlayer.inventory.slotInUse.item.id,
                                            slot: Game.currentPlayer.inventory.slotInUse.id,
                                            dest: player.id
                                        });
                                        Game.currentPlayer.inventory.slotInUse = null;
                                        handled = true;
                                        return;
                                    }
                                }
                            }

                            if (!handled) {
                                const boundingBox = Game.currentPlayer.getCurrentSpriteFrame().getBoundingBox();
                                const rect = new Rectangle(
                                    Game.currentPlayer.x + boundingBox.left, 
                                    Game.currentPlayer.y + boundingBox.top, 
                                    boundingBox.width, 
                                    boundingBox.height);

                                if (rect.pointWithin(Game.cursor.mousePos)) {
                                    Game.cursor.handleClick(true);
                                    Game.ws.send({
                                        action: "use",
                                        type: "player",
                                        id: Game.currentPlayer.id,
                                        src: Game.currentPlayer.inventory.slotInUse.item.id,
                                        slot: Game.currentPlayer.inventory.slotInUse.id,
                                        dest: Game.currentPlayer.id
                                    });
                                    Game.currentPlayer.inventory.slotInUse = null;
                                    handled = true;
                                    return;
                                }
                            }
                            
                            Game.currentPlayer.inventory.slotInUse = null;
                        }

                        break;
                    case 2: // right
                        if (Game.shiftPressed)
                            console.log(xyToTileId(~~Game.cursor.mousePos.x, ~~Game.cursor.mousePos.y));
                    
                        // take all the things that are at this position and add them to the context menu
                        if (Game.ContextMenu.active)
                            break;
                        // only check for the other players and ground items if the click was within the world rect
                        for (let i in Game.Room.otherPlayers) {
                            const p = Game.Room.otherPlayers[i];
                            if (p.clickBox.pointWithin(Game.cursor.mousePos)) {
                                if (Game.currentPlayer.inventory.slotInUse) {
                                    Game.ContextMenu.push([{
                                        id: Game.currentPlayer.id,
                                        action: "use",
                                        src: Game.currentPlayer.inventory.slotInUse.item.id,
                                        dest: p.id,
                                        type: "player",
                                        label: "use {0} -> {1} (lvl {2})".format(Game.currentPlayer.inventory.slotInUse.item.name, p.name, p.combatLevel)
                                    }]);
                                } else {
                                    Game.ContextMenu.push(p.contextMenuOptions());
                                }
                            }
                        }

                        Game.Room.drawableSceneryMap.forEach(function(value, key, map) {
                            for (let i in value) {
                                const boundingBox = value[i].sprite[0].getBoundingBox();
                                const rect = new Rectangle(
                                    value[i].x + boundingBox.left, 
                                    value[i].y + boundingBox.top, 
                                    boundingBox.width, 
                                    boundingBox.height);

                                if (rect.pointWithin(Game.cursor.mousePos)) {
                                    const tileId = value[i].tileId;
                                    const scenery = Game.sceneryMap.get(value[i].id);
                                    
                                    const unusable = ((value[i].attributes || 0) & 1) == 1;
                                    if (Game.currentPlayer.inventory.slotInUse && scenery.name && !unusable) {
                                        Game.ContextMenu.push([{
                                            id: Game.currentPlayer.id,
                                            action: "use",
                                            src: Game.currentPlayer.inventory.slotInUse.item.id,
                                            dest: tileId,
                                            type: "scenery",
                                            label: "use {0} -> {1}".format(Game.currentPlayer.inventory.slotInUse.item.name, scenery.name)
                                        }]);
                                    } else {
                                        // add the leftclick option first (if there is one)
                                        if (scenery.leftclickOption != 0) {
                                            Game.ContextMenu.push([{
                                                action: Game.ContextMenu.getContextOptionById(scenery.leftclickOption, "scenery").name,
                                                objectId: scenery.id,
                                                tileId: tileId,
                                                objectName: scenery.name,
                                                label: value[i].label, // sometimes door overrides label to say "close" instead of "open"
                                                type: "scenery"
                                            }]);
                                        }
                                        const sceneryContextOptions = Game.ContextMenu.contextOptions.get("scenery");
                                        for (let i = 0; i < sceneryContextOptions.length; ++i) {
                                            const contextOption = sceneryContextOptions[i];
                                            if (scenery.otherOptions & contextOption.id) {
                                                Game.ContextMenu.push([{
                                                    action: contextOption.name, 
                                                    objectId: scenery.id, 
                                                    tileId: tileId, 
                                                    objectName: scenery.name, 
                                                    type: "scenery"
                                                }]);
                                            }
                                        }

                                        // i guess if it's unusable you shouldn't be able to examine it either.
                                        // shit like walls
                                        if (!unusable) {
                                            Game.ContextMenu.push([{ 
                                                    action: "examine", 
                                                    objectName: scenery.name, 
                                                    objectId: scenery.id, 
                                                    tileId,
                                                    type: "scenery"
                                                }
                                            ]);
                                        }
                                    }
                                }
                            }
                        });

                        for (let i = 0; i < Game.Room.npcs.length; ++i) {
                            const npc = Game.Room.npcs[i];

                            const boundingBox = npc.getCurrentSpriteFrame().getBoundingBox();
                            const rect = new Rectangle(
                                npc.pos.x + boundingBox.left, 
                                npc.pos.y + boundingBox.top, 
                                boundingBox.width, 
                                boundingBox.height);

                            if (rect.pointWithin(Game.cursor.mousePos)) {
                                if (Game.currentPlayer.inventory.slotInUse) {
                                    Game.ContextMenu.push([{
                                        id: Game.currentPlayer.id,
                                        action: "use",
                                        src: Game.currentPlayer.inventory.slotInUse.item.id,
                                        dest: npc.instanceId,
                                        type: "npc",
                                        label: "use {0} -> {1}".format(Game.currentPlayer.inventory.slotInUse.item.name, npc.get("name"))
                                                    + (npc.get("leftclickOption") === 1 ? ` (lvl ${npc.get("cmb")})` : "")
                                    }]);
                                } else {
                                    const npcContextOptions = Game.ContextMenu.contextOptions.get("npc");
                                    let otherOptions = npc.get("otherOptions")
                                    if (npc.ownerId === Game.currentPlayer.id) {
                                        // this is the player's pet; should have the "pick up" option first
                                        // original left-click option gets combined with the other options
                                        Game.ContextMenu.push([{
                                            action: "pick up",
                                            objectId: npc.instanceId,
                                            objectName: npc.get("name"),
                                            type: "npc"
                                        }]);
                                        
                                        otherOptions += npc.get("leftclickOption");
                                    } else {
                                        if (npc.get("leftclickOption") != 0) {
                                            Game.ContextMenu.push([{
                                                action: Game.ContextMenu.getContextOptionById(npc.get("leftclickOption"), "npc").name,
                                                objectId: npc.instanceId,
                                                objectName: npc.get("name"),
                                                type: "npc",
                                                label: npc.getLeftclickLabel()
                                            }]);
                                        }
                                    }

                                    for (let j = 0; j < npcContextOptions.length; ++j) {
                                        const contextOption = npcContextOptions[j];
                                        if (otherOptions & contextOption.id) {
                                            Game.ContextMenu.push([{
                                                action: contextOption.name, 
                                                objectId: npc.instanceId, 
                                                objectName: npc.get("name"), 
                                                type: "npc"
                                            }]);
                                        }
                                    }

                                    Game.ContextMenu.push([{ 
                                        action: "examine", 
                                        objectName: npc.get("name"), 
                                        objectId: npc.instanceId, 
                                        tileId: npc.instanceId,
                                        type: "npc"
                                    }]);
                                }
                            }
                        }

                        const boundingBox = Game.currentPlayer.getCurrentSpriteFrame().getBoundingBox();
                        const rect = new Rectangle(
                            Game.currentPlayer.x + boundingBox.left, 
                            Game.currentPlayer.y + boundingBox.top, 
                            boundingBox.width, 
                            boundingBox.height);

                        if (rect.pointWithin(Game.cursor.mousePos)) {
                            if (Game.currentPlayer.inventory.slotInUse) {
                                Game.ContextMenu.push([{
                                    id: Game.currentPlayer.id,
                                    action: "use",
                                    src: Game.currentPlayer.inventory.slotInUse.item.id,
                                    dest: Game.currentPlayer.id,
                                    type: "player",
                                    label: "use {0} -> {1} (lvl {2})".format(Game.currentPlayer.inventory.slotInUse.item.name, Game.currentPlayer.name, Game.currentPlayer.combatLevel)
                                }]);
                            }
                        }

                        Game.Room.groundItems
                            .filter(groundItem => groundItem.clickBox.pointWithin(Game.cursor.mousePos))
                            .reverse() // we wanna go from the top down to the bottom of the pile, so we need to reverse the list
                            .forEach(groundItem => {
                                Game.ContextMenu.push([
                                    { action: "take", objectName: groundItem.item.name, itemId: groundItem.item.id, tileId: groundItem.tileId },
                                    { action: "examine", objectName: groundItem.item.name, objectId: groundItem.item.id, tileId: groundItem.tileId, type: "grounditem"}
                                ]);
                            });
                        break;
                }
            }
            // all cases
            switch (e.button) {
                case 0: // left
                    break;
                case 2: // right
                    if (!Game.ContextMenu.active)
                        Game.ContextMenu.show(~~Game.cursor.mousePos.x, ~~Game.cursor.mousePos.y, ~~Game.cam.xView, ~~Game.cam.yView);
                    break;
            }
        }
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        if (Game.activeUiWindow) {
            Game.activeUiWindow.onMouseUp(e);
            return;
        }

        else if (Game.state === 'game') {
            // TODO move inventory, minimap etc events into this
            if (Game.HUD.mouseWithin(Game.mousePos)) {
                Game.HUD.onMouseUp(e);
            } 

            switch (e.button) {
                case 0:
                    // this check is so when we right-click and select in the inventory, we don't select the slot under the context menu
                    if (Game.ContextMenu.active) {
                        Game.ContextMenu.hide();
                    }
                    else {
                        Game.currentPlayer.inventory.onMouseUp(e.button);
                    }
                    break;
            }
        }
    }, false);
    canvas.addEventListener("mousewheel", function (e) {
        if (Game.worldCameraRect.pointWithin(Game.mousePos)) {
            var e = window.event || e; // old IE support
            Game.targetScale += Math.max(-0.1, Math.min(0.1, (e.wheelDelta || -e.detail)));
            if (Game.targetScale < Game.minScale)
                Game.targetScale = Game.minScale;
            else if (Game.targetScale > Game.maxScale)
                Game.targetScale = Game.maxScale;
        }
    }, false);

    const FPS = 50;
    const INTERVAL = 1000 / FPS; // milliseconds
    
    // Game update function
    var update = function (dt) {
        if (Game.state === 'game') {
            Game.ContextMenu.setLeftclick(null, null);

            Game.scale += (Game.targetScale - Game.scale) * dt * 10;
            Game.brightness += (Game.targetBrightness - Game.brightness) * dt;
            Game.Room.process(dt);
            Game.cursor.process(dt);
            Game.cam.update(dt);
            ChatBox.process(dt);
            Game.HUD.process(dt);

            if (Game.activeUiWindow)
                Game.activeUiWindow.process(dt);

            Game.ContextMenu.process(dt);
        }
        else if (Game.state === 'logonscreen') {
            Game.LogonScreen.process(dt);
        }
    };

    // Game draw function
    var draw = function (ctx) {
        ctx.canvas.width = ctx.canvas.width;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.beginPath();

        if (Game.state === 'game') {
            
            // redraw all room objects
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, Game.cam.viewportRect.width * Game.scale, Game.cam.viewportRect.height * Game.scale);
            Game.Room.draw(ctx, Game.cam.xView, Game.cam.yView);

            // redraw all hud objects
            ctx.fillStyle = Game.hudcam.pat || "black";
            ctx.fillRect(Game.hudcam.xView, Game.hudcam.yView, Game.hudcam.viewportRect.width, Game.hudcam.viewportRect.height);
            Game.Minimap.draw(ctx, Game.cam.xView, Game.cam.yView);
            Game.currentPlayer.inventory.draw(ctx, Game.hudcam.xView, Game.hudcam.yView + Game.Minimap.height + 20);
            Game.currentPlayer.stats.draw(ctx, Game.hudcam.xView, Game.currentPlayer.stats.rect.top);
            Game.HUD.draw(ctx);
            
            ChatBox.draw(ctx, 0, ctx.canvas.height);
            if (Game.Room.currentShow <= 0.98) {
                // fade out the logon screen background
                ctx.save();
                ctx.globalAlpha = 1 - Game.Room.currentShow;
                ctx.drawImage(Game.LogonScreen.bkg, 0, 0, ctx.canvas.width, ctx.canvas.height, 
                                                    0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
            }

            let time = Game.time || "00:00";
            if (Game.displayFps) {
                time = `${time} (${Game.fps}fps)`;
            }

            ctx.save();
            ctx.textAlign = "right";
            ctx.font = "15px customFont";
            ctx.fillStyle = "yellow";
            ctx.fillText(time, Game.worldCameraRect.width - 5, 10);
            ctx.restore();

            if (Game.activeUiWindow)
                Game.activeUiWindow.draw(ctx);
            
            Game.ContextMenu.draw(ctx);
        }
        else if (Game.state === 'logonscreen') {
            Game.LogonScreen.draw(ctx, ctx.canvas.width, ctx.canvas.height);
        }
    };

    var processResponses = function() {
        ResponseController.process([...Game.responseQueue]);
        Game.responseQueue = [];
    }
    
    // Game Loop
    var gameLoop = function (dt) {
        processResponses();
        update(dt);
        draw(context);
    };

    var start = Date.now();
    var remainingInterval = INTERVAL;
    Game.fps = 0;
    Game.displayFps = true;
    let fpsSamples = [];
    Game.play = function () {
        requestTimeout(function() {
            // TODO game loop should return exec ms to subtract off INTERVAL
            gameLoop(INTERVAL / 1000);

            var actual = Date.now() - start;
            fpsSamples.push(actual);
            if (fpsSamples.length > 60)
                fpsSamples.shift();
            let average = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
            Game.fps = ~~(1000 / average);
            // subtract any extra ms from the delay for the next cycle
            remainingInterval = INTERVAL - (actual - INTERVAL);
            start = Date.now();

            Game.play();
        }, remainingInterval);
    };

    Game.play();
});

















window.addEventListener("mousemove", function (e) {
    Game.calculateMousePos(e);
});
window.addEventListener("keypress", function (e) {
    var inp = String.fromCharCode(event.keyCode);
    if (Game.state === 'game') {
        ChatBox.onKeyPress(inp);
    }
    else if (Game.state === 'logonscreen') {
        Game.LogonScreen.onKeyPress(inp);
    }
});
window.addEventListener("keydown", function (e) {
    var event = window.event ? window.event : e;
    if (event.keyCode === 9) //tab
        event.preventDefault(); // don't tab focus off the canvas
    if (event.keyCode === 16) // shift
        Game.shiftPressed = true;
    if (event.keyCode === 17) // ctrl
        Game.ctrlPressed = true;

    if (Game.state === 'logonscreen') {
        Game.LogonScreen.onKeyDown(event.keyCode);
        return;
    }
    else if (Game.state === 'game') {
        switch (event.keyCode) {
            case 27: // escape
                if (ChatBox.input) {
                    ChatBox.clearInput();
                } else if (Game.activeUiWindow) {
                    Game.activeUiWindow = null;
                }

                break;
            case 38: // up
                Game.targetScale += 0.1;
                if (Game.targetScale > 2)
                    Game.targetScale = 2;
                break;
            case 40: // down
                Game.targetScale -= 0.1;
                if (Game.targetScale < 1)
                    Game.targetScale = 1;
                break;
            default:
                ChatBox.onKeyDown(event.keyCode);
        }
    }
});
window.addEventListener("keyup", function (e) {
    let event = window.event ? window.event : e;
    if (event.keyCode === 16) // shift
        Game.shiftPressed = false;
    if (event.keyCode === 17) // ctrl
        Game.ctrlPressed = false;
});
window.addEventListener("resize", function(e) {
    const canvas = document.getElementById("game");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    Game.boundingRect = canvas.getBoundingClientRect();

    Game.otherContext.canvas.width  = canvas.width;
    Game.otherContext.canvas.height = canvas.height;


    Game.cam.updateCanvasSize(0, 0, canvas.width - 250, canvas.height);
    Game.worldCameraRect.set(0, 0, canvas.width - 250, canvas.height);
    Game.cam.follow(Game.currentPlayer, (canvas.width - 250 - (Game.currentPlayer.width / 2)) / 2, (canvas.height) / 2);

    Game.hudCameraRect.set(Game.cam.viewportRect.width, 0, canvas.width - Game.cam.viewportRect.width, canvas.height);
    Game.hudcam.updateCanvasSize(Game.cam.viewportRect.width, 0, canvas.width - Game.cam.viewportRect.width, canvas.height);

    Game.Minimap.setRect(Game.hudcam.viewportRect.left + 10, Game.hudcam.viewportRect.top + 10, 230, 230);

    if (Game.currentPlayer) {
        Game.currentPlayer.inventory.onResize(Game.hudcam.viewportRect.left);
        Game.currentPlayer.stats.onResize(Game.hudcam.viewportRect.left);
    }
    Game.HUD.onResize(Game.hudcam.viewportRect.left);

    if (Game.activeUiWindow)
        Game.activeUiWindow.onResize(Game.worldCameraRect);
}, true);
// -->