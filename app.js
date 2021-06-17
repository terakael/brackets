$(function () {
    // import ResponseController from 'responses/ResponseController.js'

    // prepare our game canvas
    const canvas = document.getElementById("game");
    const context = canvas.getContext("2d");
    Game.context = context;
    const ip = "192.168.1.5", port = "45555", resourcePort = "45556";

    Game.enableSmoothing = true;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const otherCanvas = document.createElement("canvas");
    otherCanvas.width = canvas.width;
    otherCanvas.height = canvas.height
    Game.otherContext = otherCanvas.getContext("2d");

    Game.responseQueue = [];
    
    Game.resourceWs = new Game.WebSocket("ws://{0}:{1}/ws/resources".format(ip, resourcePort), function (obj) {
        if (obj["success"] == 0) {

        } else {
            if (obj["action"] === "cached_resources") {
                Game.LogonScreen.loadingText = "loading resources...";
                Game.LogonScreen.draw(context, canvas.width, canvas.height);
                SpriteManager.loadSpriteMaps(obj["spriteMaps"]).done(function() {
                    SpriteManager.loadSpriteFrames(obj["spriteFrames"]);
                    SpriteManager.loadItems(obj["items"]);
                    Game.Room.loadTextureMaps(obj.spriteMaps.map(e => e.id));
                    Game.ContextMenu.loadContextOptions(obj.contextOptions);
                    Game.statMap = new Map(Object.entries(obj["statMap"]));
                    Game.expMap = new Map();
                    for (let [key, value] of Object.entries(obj["expMap"]).sort((a, b) => b < a)) {
                        Game.expMap.set(Number(key), Number(value));
                    }
                    Game.LogonScreen.loading = false;
                    Game.LogonScreen.loadingText = null;
                });
            }
        }
    });

    Game.resourceWs.ws.onopen = function() {
        let f = new FontFace('customFont', 'url(./font.ttf)');
        f.load().then(function() {
            console.log("font loaded");
            document.fonts.add(f);
            // get the initial resources for the game (sprite maps, scenery etc)
            Game.resourceWs.send({
                action: "resources",
                id: 0
            });
        });
    };
    Game.resourceWs.ws.onclose = function() {
        console.log("loaded resources");
    };
    Game.connectAndLogin = function(username, password) {
        Game.LogonScreen.loading = true;
        Game.LogonScreen.loadingText = "logging in...";
                    
        Game.ws = new Game.WebSocket("ws://{0}:{1}/ws/game".format(ip, port), Game.processResponse);

        Game.ws.ws.onopen = function() {
            Game.ws.send({
                action: "logon",
                name: username,
                password: password
            });
        };

        Game.ws.ws.onclose = function() {
            Game.Room.otherPlayers = [];
            Game.Room.player = null;
            document.title = 'danscape';
            if (Game.state !== 'logonscreen') {
                Game.state = 'logonscreen';
                Game.LogonScreen.reset();
            }
            console.log("server closed connection");
        }

        Game.ws.ws.onerror = function() {
            if (Game.state === 'logonscreen') {
                Game.LogonScreen.setError("Error connecting to server.")
            }
        }
    };
    Game.processResponse = function(arr) {
        Game.responseQueue.push(...arr);
        for (var ele = 0; ele < arr.length; ++ele) {
            var obj = arr[ele];
            if (obj.success === 0) {
                if (Game.state === 'logonscreen') {
                    Game.LogonScreen.setError(obj.responseText);
                }
                else {
                    Game.ChatBox.add(obj.responseText);
                }
            }
            else {
                if (obj.responseText.length > 0 && Game.state === "game") {
                    Game.ChatBox.add(obj.responseText, obj.colour);
                }

                ResponseController.process(obj);
            }
        }
    }

    Game.boundingRect = canvas.getBoundingClientRect();
    
    // setup an object that represents the room
    
    canvas.addEventListener("mousedown", function (e) {
        if (Game.state === 'game') {

            // TODO inventory, minimap, stats etc should all be contained within this
            if (Game.HUD.mouseWithin(Game.mousePos)) {
                Game.HUD.onMouseDown(e);
            } 

            if (Game.activeUiWindow) {
                Game.activeUiWindow.onMouseDown(e);
            }
            else if (Game.getPlayer().inventory.rect.pointWithin(Game.mousePos) || 
                    (Game.ContextMenu.active && Game.getPlayer().inventory.rect.pointWithin({x: Game.ContextMenu.rect.left, y: Game.ContextMenu.rect.top}))) {
                // if the player right-clicks on an item near the bottom of the inventory and the context option is off the inventory rect
                // then we still want to handle the mouse click right
                Game.getPlayer().inventory.onMouseDown(e.button);
            } 
            else if (Game.ContextMenu.active && e.button == 0) {// left
                // selecting a context option within the game world
                Game.ContextMenu.handleMenuSelect();
                Game.Room.player.inventory.slotInUse = null;
            }
            else if (Game.Minimap.rect.pointWithin(Game.mousePos)) {
                Game.Minimap.onMouseDown(e.button);
            } 
            else if (Game.Room.player.stats.rect.pointWithin(Game.mousePos)) {
                Game.Room.player.stats.onMouseDown(e.button);
            }
            else if (Game.worldCameraRect.pointWithin(Game.mousePos)) {
                switch (e.button) {
                    case 0: // left
                        if (!Game.ContextMenu.active && Game.Room.player.inventory.slotInUse == null) {
                            if (Game.ContextMenu.leftclickMenuOption == null) {
                                // no stored leftclick option, so just move to the position
                                cursor.handleClick(false);

                                if (Game.ctrlPressed && Game.getPlayer().id === 3) { // special case for god
                                    let tileId = xyToTileId(~~cursor.mousePos.x, ~~cursor.mousePos.y);
                                    Game.ws.send({
                                        action: "message",
                                        id: Game.getPlayer().id,
                                        message: `::tele ${tileId}`
                                    });
                                } else {
                                    Game.ws.send({ action: "move", id: Game.Room.player.id, x: ~~cursor.mousePos.x, y: ~~cursor.mousePos.y });
                                    Game.Minimap.setPlayerDestXY(~~cursor.mousePos.x, ~~cursor.mousePos.y);
                                }
                            } else {
                                // there's a stored leftclick option so perform the leftclick option
                                cursor.handleClick(true);
                                Game.ws.send(Game.ContextMenu.leftclickMenuOption);
                            }
                        } else if (Game.Room.player.inventory.slotInUse != null) {
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
                                    if (rect.pointWithin(cursor.mousePos) && !unusable) {// don't use with walls, fences etc
                                        cursor.handleClick(true);
                                        const tileId = value[i].tileId;
                                        Game.ws.send({
                                            action: "use",
                                            id: Game.Room.player.id,
                                            src: Game.Room.player.inventory.slotInUse.item.id,
                                            dest: tileId,
                                            type: "scenery",
                                            slot: Game.Room.player.inventory.slotInUse.id
                                        });
                                        Game.Room.player.inventory.slotInUse = null;
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

                                    if (rect.pointWithin(cursor.mousePos)) {
                                        cursor.handleClick(true);
                                        Game.ws.send({
                                            action: "use",
                                            type: "npc",
                                            id: Game.Room.player.id,
                                            src: Game.Room.player.inventory.slotInUse.item.id,
                                            slot: Game.Room.player.inventory.slotInUse.id,
                                            dest: Game.Room.npcs[i].instanceId
                                        });
                                        Game.Room.player.inventory.slotInUse = null;
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
        
                                    if (rect.pointWithin(cursor.mousePos)) {
                                        cursor.handleClick(true);
                                        Game.ws.send({
                                            action: "use",
                                            type: "player",
                                            id: Game.Room.player.id,
                                            src: Game.Room.player.inventory.slotInUse.item.id,
                                            slot: Game.Room.player.inventory.slotInUse.id,
                                            dest: player.id
                                        });
                                        Game.Room.player.inventory.slotInUse = null;
                                        handled = true;
                                        return;
                                    }
                                }
                            }

                            if (!handled) {
                                const boundingBox = Game.Room.player.getCurrentSpriteFrame().getBoundingBox();
                                const rect = new Rectangle(
                                    Game.Room.player.x + boundingBox.left, 
                                    Game.Room.player.y + boundingBox.top, 
                                    boundingBox.width, 
                                    boundingBox.height);

                                if (rect.pointWithin(cursor.mousePos)) {
                                    cursor.handleClick(true);
                                    Game.ws.send({
                                        action: "use",
                                        type: "player",
                                        id: Game.Room.player.id,
                                        src: Game.Room.player.inventory.slotInUse.item.id,
                                        slot: Game.Room.player.inventory.slotInUse.id,
                                        dest: Game.Room.player.id
                                    });
                                    Game.Room.player.inventory.slotInUse = null;
                                    handled = true;
                                    return;
                                }
                            }
                            
                            Game.Room.player.inventory.slotInUse = null;
                        }

                        break;
                    case 2: // right
                        // take all the things that are at this position and add them to the context menu
                        if (Game.ContextMenu.active)
                            break;
                        // only check for the other players and ground items if the click was within the world rect
                        for (let i in Game.Room.otherPlayers) {
                            const p = Game.Room.otherPlayers[i];
                            if (p.clickBox.pointWithin(cursor.mousePos)) {
                                if (Game.Room.player.inventory.slotInUse) {
                                    Game.ContextMenu.push([{
                                        id: Game.Room.player.id,
                                        action: "use",
                                        src: Game.Room.player.inventory.slotInUse.item.id,
                                        dest: p.id,
                                        type: "player",
                                        label: "use {0} -> {1} (lvl {2})".format(Game.Room.player.inventory.slotInUse.item.name, p.name, p.combatLevel)
                                    }]);
                                } else {
                                    Game.ContextMenu.push(p.contextMenuOptions());
                                }
                            }
                        }
                        for (let i in Game.Room.groundItems) {
                            const groundItem = Game.Room.groundItems[i];
                            if (groundItem.clickBox.pointWithin(cursor.mousePos)) {
                                Game.ContextMenu.push([
                                    { action: "take", objectName: groundItem.item.name, itemId: groundItem.item.id, tileId: groundItem.tileId },
                                    { action: "examine", objectName: groundItem.item.name, objectId: groundItem.item.id, type: "item", source: "ground" }
                                ]);
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

                                if (rect.pointWithin(cursor.mousePos)) {
                                    const tileId = value[i].tileId;
                                    const scenery = Game.sceneryMap.get(value[i].id);
                                    
                                    const unusable = ((value[i].attributes || 0) & 1) == 1;
                                    if (Game.Room.player.inventory.slotInUse && scenery.name && !unusable) {
                                        Game.ContextMenu.push([{
                                            id: Game.Room.player.id,
                                            action: "use",
                                            src: Game.Room.player.inventory.slotInUse.item.id,
                                            dest: tileId,
                                            type: "scenery",
                                            label: "use {0} -> {1}".format(Game.Room.player.inventory.slotInUse.item.name, scenery.name)
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
                                        Game.ContextMenu.push([{ 
                                                action: "examine", 
                                                objectName: scenery.name, 
                                                objectId: scenery.id, 
                                                type: "scenery"
                                            }
                                        ]);
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

                            if (rect.pointWithin(cursor.mousePos)) {
                                if (Game.Room.player.inventory.slotInUse) {
                                    Game.ContextMenu.push([{
                                        id: Game.Room.player.id,
                                        action: "use",
                                        src: Game.Room.player.inventory.slotInUse.item.id,
                                        dest: npc.instanceId,
                                        type: "npc",
                                        label: "use {0} -> {1}".format(Game.Room.player.inventory.slotInUse.item.name, npc.get("name"))
                                                    + (npc.get("leftclickOption") === 1 ? ` (lvl ${npc.get("cmb")})` : "")
                                    }]);
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

                                    const npcContextOptions = Game.ContextMenu.contextOptions.get("npc");
                                    for (let j = 0; j < npcContextOptions.length; ++j) {
                                        const contextOption = npcContextOptions[j];
                                        if (npc.get("otherOptions") & contextOption.id) {
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
                                        type: "npc"
                                    }
                                ]);
                                }
                            }
                        }

                        const boundingBox = Game.Room.player.getCurrentSpriteFrame().getBoundingBox();
                        const rect = new Rectangle(
                            Game.Room.player.x + boundingBox.left, 
                            Game.Room.player.y + boundingBox.top, 
                            boundingBox.width, 
                            boundingBox.height);

                        if (rect.pointWithin(cursor.mousePos)) {
                            if (Game.Room.player.inventory.slotInUse) {
                                Game.ContextMenu.push([{
                                    id: Game.Room.player.id,
                                    action: "use",
                                    src: Game.Room.player.inventory.slotInUse.item.id,
                                    dest: Game.Room.player.id,
                                    type: "player",
                                    label: "use {0} -> {1} (lvl {2})".format(Game.Room.player.inventory.slotInUse.item.name, Game.Room.player.name, Game.Room.player.combatLevel)
                                }]);
                            }
                        }
                        break;
                }
            }
            // all cases
            switch (e.button) {
                case 0: // left
                    break;
                case 2: // right
                    if (!Game.ContextMenu.active)
                        Game.ContextMenu.show(~~cursor.mousePos.x, ~~cursor.mousePos.y, ~~Game.cam.xView, ~~Game.cam.yView);
                    break;
            }
        }
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        if (Game.activeUiWindow) {
            Game.activeUiWindow.onMouseUp(e);
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
                        Game.getPlayer().inventory.onMouseUp(e.button);
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

    // setup the magic camera !!!
    Game.cam = new Game.Camera(Game.Room.player.x, Game.Room.player.y, canvas.width - 250, canvas.height);
    Game.worldCameraRect = new Rectangle(0, 0, canvas.width - 250, canvas.height);

    var hudcamera = new Game.Camera(Game.cam.viewportRect.width, 0, canvas.width - Game.cam.viewportRect.width, canvas.height);
    Game.hudCameraRect = new Rectangle(Game.cam.viewportRect.width, 0, canvas.width - Game.cam.viewportRect.width, canvas.height);
    Game.HUD = new Game.HeadsUpDisplay(Game.hudCameraRect);
    Game.hudcam = hudcamera;

    Game.Minimap.setRect(hudcamera.viewportRect.left + 10, hudcamera.viewportRect.top + 10, 230, 230);
    var cursor = new Game.Cursor((hudcamera.xView + hudcamera.wView) - 10, hudcamera.yView + 20);
    Game.cursor = cursor;

    const FPS = 50;
    const INTERVAL = 1000 / FPS; // milliseconds
    // const STEP = INTERVAL / 1000; // seconds
    
    // Game update function
    var update = function (dt) {
        if (Game.state === 'game') {
            Game.ContextMenu.setLeftclick(null, null);

            Game.scale += (Game.targetScale - Game.scale) * dt * 10;
            Game.Room.process(dt);
            cursor.process(dt);
            Game.cam.update(dt);
            Game.ChatBox.process(dt);
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
    var draw = function () {
        Game.context.canvas.width = Game.context.canvas.width;
        Game.context.clearRect(0, 0, Game.context.canvas.width, Game.context.canvas.height);
        Game.context.beginPath();

        if (Game.state === 'game') {
            
            // redraw all room objects
            Game.context.fillStyle = "#000";
            Game.context.fillRect(0, 0, Game.cam.viewportRect.width * Game.scale, Game.cam.viewportRect.height * Game.scale);
            Game.Room.draw(Game.context, Game.cam.xView, Game.cam.yView);
            // redraw all hud objects
            Game.context.fillStyle = Game.hudcam.pat || "black";
            Game.context.fillRect(Game.hudcam.xView, Game.hudcam.yView, Game.hudcam.viewportRect.width, Game.hudcam.viewportRect.height);
            Game.Minimap.draw(Game.context, Game.cam.xView, Game.cam.yView);
            Game.Room.player.inventory.draw(Game.context, Game.hudcam.xView, Game.hudcam.yView + Game.Minimap.height + 20);
            Game.Room.player.stats.draw(Game.context, Game.hudcam.xView, Game.Room.player.stats.rect.top);
            Game.HUD.draw(Game.context);
            
            if (Game.Room.currentShow <= 0.98) {
                // fade out the logon screen background
                Game.context.save();
                Game.context.globalAlpha = 1 - Game.Room.currentShow;
                Game.context.drawImage(Game.LogonScreen.bkg, 0, 0, Game.context.canvas.width, Game.context.canvas.height, 
                                                            0, 0, Game.context.canvas.width, Game.context.canvas.height);
                Game.context.restore();
            }
            Game.ChatBox.draw(Game.context, 0, Game.context.canvas.height);

            if (Game.displayFps) {
                Game.context.save();
                context.textAlign = "right";
                context.font = "15px customFont";
                context.fillStyle = "yellow";
                context.fillText(Game.fps, Game.worldCameraRect.width - 5, 10);
                Game.context.restore();
            }

            if (Game.activeUiWindow)
                Game.activeUiWindow.draw(Game.context);
            
            Game.ContextMenu.draw(Game.context);
        }
        else if (Game.state === 'logonscreen') {
            Game.LogonScreen.draw(Game.context, Game.context.canvas.width, Game.context.canvas.height);
        }
    };

    var processResponses = function() {
        // ResponseController.process([...Game.responseQueue]);
        Game.responseQueue = [];
    }
    
    // Game Loop
    var gameLoop = function (dt) {
        processResponses();
        update(dt);
        draw();
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
    Game.getPlayer = function () {
        return Game.Room.player;
    };

    Game.play();
    // -->
});

















window.addEventListener("mousemove", function (e) {
    Game.calculateMousePos(e);
});
window.addEventListener("keypress", function (e) {
    var inp = String.fromCharCode(event.keyCode);
    if (Game.state === 'game') {
        if (/[a-zA-Z0-9 @#$-/:-?{-~!"^_`\[\]]/.test(inp)) {
            if (Game.ChatBox.userMessage.length < 100)
                Game.ChatBox.userMessage += inp;
            return;
        }
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
                if (Game.activeUiWindow)
                    Game.activeUiWindow = null;
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
            case 13: //enter
                if (Game.ChatBox.userMessage.length > 0) {
                    // todo list of client-side debug commands
                    switch (Game.ChatBox.userMessage) {
                        case "::boundingBoxes":
                            Game.drawBoundingBoxes = !Game.drawBoundingBoxes;
                            Game.ChatBox.add("turned bounding boxes " + (Game.drawBoundingBoxes ? "on." : "off."));
                            break;

                        case "::cursor": {
                            Game.cursor.drawCursor = !Game.cursor.drawCursor;
                            break;
                        }

                        case "::groundTextureOutline": {
                            Game.drawGroundTextureOutline = !Game.drawGroundTextureOutline;
                            break;
                        }

                        case "::fps": {
                            Game.displayFps = !Game.displayFps;
                            break;
                        }

                        case "::bank": {
                            Game.ws.send({
                                action: "bank",
                                id: Game.getPlayer().id
                            });
                            break;
                        }

                        case "::smoothing": {
                            Game.enableSmoothing = !Game.enableSmoothing;
                            break;
                        }

                        default: {
                            Game.ws.send({
                                action: "message",
                                id: Game.getPlayer().id,
                                message: Game.ChatBox.userMessage
                            });
                            break;
                        }
                    }
                    
                    Game.ChatBox.userMessage = '';
                }
                break;
            case 8: // backspace
                if (Game.ChatBox.userMessage.length > 0)
                    Game.ChatBox.userMessage = Game.ChatBox.userMessage.substring(0, Game.ChatBox.userMessage.length - 1);
                break;
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
    Game.context.canvas.width  = window.innerWidth;
    Game.context.canvas.height = window.innerHeight;
    Game.boundingRect = Game.context.canvas.getBoundingClientRect();

    Game.otherContext.canvas.width  = Game.context.canvas.width;
    Game.otherContext.canvas.height = Game.context.canvas.height;


    Game.cam.updateCanvasSize(0, 0, Game.context.canvas.width - 250, Game.context.canvas.height);
    Game.worldCameraRect.set(0, 0, Game.context.canvas.width - 250, Game.context.canvas.height);
    Game.cam.follow(Game.getPlayer(), (Game.context.canvas.width - 250 - (Game.getPlayer().width / 2)) / 2, (Game.context.canvas.height) / 2);

    Game.hudCameraRect.set(Game.cam.viewportRect.width, 0, Game.context.canvas.width - Game.cam.viewportRect.width, Game.context.canvas.height);
    Game.hudcam.updateCanvasSize(Game.cam.viewportRect.width, 0, Game.context.canvas.width - Game.cam.viewportRect.width, Game.context.canvas.height);

    Game.Minimap.setRect(Game.hudcam.viewportRect.left + 10, Game.hudcam.viewportRect.top + 10, 230, 230);

    if (Game.getPlayer()) {
        Game.getPlayer().inventory.onResize(Game.hudcam.viewportRect.left);
        Game.getPlayer().stats.onResize(Game.hudcam.viewportRect.left);
    }
    Game.HUD.onResize(Game.hudcam.viewportRect.left);

    if (Game.activeUiWindow)
        Game.activeUiWindow.onResize(Game.worldCameraRect);
}, true);
// -->