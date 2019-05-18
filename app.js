$(function () {
    // prepare our game canvas
    var canvas = document.getElementById("game"), context = canvas.getContext("2d"), ip = "localhost", port = "45555";
    Game.ws = new Game.WebSocket("ws://{0}:{1}/ws/game".format(ip, port), function (arr) {
        for (var ele = 0; ele < arr.length; ++ele) {
            var obj = arr[ele];
            if (obj["success"] === 0) {
                if (Game.state === 'logonscreen') {
                    Game.LogonScreen.setError(obj["responseText"]);
                }
                else {
                    Game.ChatBox.add(obj["responseText"]);
                }
            }
            else {
                if (obj["action"] === "logon") {
                    Game.SpriteManager.loadSpriteMaps(obj["spriteMaps"]);
                    Game.SpriteManager.loadSpriteFrames(obj["spriteFrames"]);
                    Game.SpriteManager.loadItems(obj["items"]);
                    room.loadScenery(obj["scenery"]);
                    document.title = obj["name"];
                    var playerXY = tileIdToXY(obj["tileId"]);
                    room.player = new Game.Player(obj["tileId"]);
                    Game.Player.prototype.image = Game.SpriteManager.getSpriteMapByName("characters");
                    room.player.loadStats(obj["stats"]);
                    room.player.loadInventory(obj["inventory"]);
                    room.player.setEquippedSlots(obj["equippedSlots"]);
                    room.player.setAnimations(obj["animations"]);
                    room.player.currentHp = obj["currentHp"];
                    room.player.stats.currentHp = room.player.currentHp;
                    room.player.maxHp = obj["maxHp"];
                    room.player.id = obj["id"];
                    room.player.name = obj["name"];
                    camera.follow(room.player, (canvas.width - 250 - (room.player.width / 2)) / 2, (canvas.height) / 2);

                    
                    camera.xView = playerXY.x - (camera.xDeadZone * (1 / Game.scale));
                    camera.yView = playerXY.y - (camera.yDeadZone * (1 / Game.scale));
                    room.updateGroundItems(obj["groundItems"]);
                    for (var i in obj["players"]) {
                        room.addPlayer(obj["players"][i]);
                    }
                    room.loadBackground(Game.SpriteManager.getSpriteMapByName("grass"));
                    room.init();
                    Game.ChatBox.add("Welcome to the game, {0}.".format(obj["name"]));
                    Game.state = 'game';
                }
                else if (obj["action"] === "logoff") {
                    // clean up and change state to logon screen
                    room.otherPlayers = [];
                    Game.state = 'logonscreen';
                }
                else if (obj["action"] === "message") {
                    if (obj["message"]) {
                        Game.ChatBox.add("{0}: {1}".format(obj["name"], obj["message"]), obj["colour"] == null ? 'yellow' : obj["colour"]);
                        if (obj["id"] == room.player.id) {
                            room.player.setChatMessage(obj["message"]);
                        }
                        else {
                            for (var i in room.otherPlayers) {
                                if (obj["id"] == room.otherPlayers[i].id) {
                                    room.otherPlayers[i].setChatMessage(obj["message"]);
                                }
                            }
                        }
                    }
                }
                else if (obj["action"] === "playerEnter") {
                    var p = obj["player"];
                    room.addPlayer(p);
                    Game.ChatBox.add(p["name"] + " has logged in.", "#0ff");
                }
                else if (obj["action"] === "playerLeave") {
                    room.removePlayer(obj["id"]); // TODO should be session id; this is dangerous
                    Game.ChatBox.add(obj["name"] + " has logged out.", "#0ff");
                }
                else if (obj["action"] === "addexp") {
                    if (obj["id"] == room.player.id) {
                        room.player.stats.gainExp(obj["statShortName"], obj["exp"]);
                        if (obj["statShortName"] === "hp") {
                            room.player.maxHp = room.player.stats.exp2lvl(obj["exp"]);
                        }
                    }
                }
                else if (obj["action"] === "unknown") {
                    Game.ChatBox.add("invalid action.", "#fff");
                }
                else if (obj["action"] === "duel" || obj["action"] === "trade") {
                    if (obj["accepted"] === 0) {
                        Game.ChatBox.add("{0} wishes to {1} with you.".format(obj["opponentName"], obj["action"]), "#f0f");
                    }
                    else {
                        Game.ChatBox.add("{0} accepted the {1}.".format(obj["opponentName"], obj["action"]), "#f0f");
                    }
                }
                else if (obj["action"] === "damage") {
                    if (obj["id"] == room.player.id) {
                        room.player.damage(obj["damage"]);
                    }
                    else {
                        for (var i in room.otherPlayers) {
                            if (obj["id"] == room.otherPlayers[i].id) {
                                room.otherPlayers[i].damage(obj["damage"]);
                                break;
                            }
                        }
                    }
                }
                else if (obj["action"] === "dead") {
                    if (obj["id"] == room.player.id) {
                        // you died lmfao
                        room.player.respawn(obj["tileId"], obj["currentHp"]);
                        room.player.setDeathSequence();
                    }
                    else {
                        for (var i in room.otherPlayers) {
                            if (obj["id"] == room.otherPlayers[i].id) {
                                // they died
                                room.otherPlayers[i].respawn(obj["tileId"], obj["currentHp"]);
                                // no death sequence so move them to respawn position straight away
                                var playerXY = tileIdToXY(obj["tileId"]);
                                room.otherPlayers[i].x = playerXY.x;
                                room.otherPlayers[i].y = playerXY.y;
                                room.otherPlayers[i].destPos.x = playerXY.x;
                                room.otherPlayers[i].destPos.y = playerXY.y;
                                break;
                            }
                        }
                    }
                }
                else if (obj["action"] === "invmove" || obj["action"] === "invupdate") {
                    room.player.updateInventory(obj["inventory"]);
                    room.player.setEquippedSlots(obj["equippedSlots"]);
                }
                else if (obj["action"] === "equip") {
                    room.player.setEquippedSlots(obj["equippedSlots"]);
                }
                else if (obj["action"] === "drop" || obj["action"] === "take") {
                    room.updateGroundItems(obj["groundItems"]);
                }
                else if (obj["action"] === "duel") {
                    var fighter1, fighter2;
                    if (obj["fighter1id"] === room.player.id) {
                        fighter1 = room.player;
                    }
                    else {
                        for (var i in room.otherPlayers) {
                            if (room.otherPlayers[i].id === obj["fighter1id"])
                                fighter1 = room.otherPlayers[i];
                            else if (room.otherPlayers[i].id === obj["fighter2id"])
                                fighter2 = room.otherPlayers[i];
                        }
                    }
                    // TODO NPC fighting
                    if (fighter1 && fighter2)
                        Game.FightManager.addFight(fighter1, fighter2);
                }
                else if (obj["action"] === "player_update") {
                    if (obj["tile"]) {
                        if (obj["id"] == room.player.id) {
                            room.player.setDestPosAndSpeedByTileId(obj["tile"]);
                        } else {
                            for (var i in room.otherPlayers) {
                                if (obj["id"] == room.otherPlayers[i].id) {
                                    room.otherPlayers[i].setDestPosAndSpeedByTileId(obj["tile"]);
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    Game.mousePos = { x: 0, y: 0 };
    Game.boundingRect = canvas.getBoundingClientRect();
    Game.state = 'logonscreen';
    Game.scale = 1.5;
    Game.targetScale = 1.5;
    Game.maxScale = 2;
    Game.minScale = 1;
    //Game.sceneryMap = new Map();
    // game settings:	
    var FPS = 50, INTERVAL = 1000 / FPS, // milliseconds
    STEP = INTERVAL / 1000; // seconds
    // setup an object that represents the room
    var room = {
        map: new Game.Map(8000, 8000, canvas.width - 250, canvas.height),
        player: {},
        show: 0,
        currentShow: 0,
        otherPlayers: [],
        sceneryInstances: new Map(),
        t: new Game.Transform(),
        loadBackground: function(background) {
            this.map.load(context, background);
        },
        init: function () {
            this.show = 1.0;
        },
        loadScenery: function(sceneryJson) {
            for (var i = 0; i < sceneryJson.length; ++i) {
                // save the scenery object

                // TODO return the raw spriteframe data directly
                var spriteFrame = new Game.SpriteFrame({
                    id: sceneryJson[i].id,
                    sprite_map_id: sceneryJson[i].spriteMapId,
                    x: sceneryJson[i].x,
                    y: sceneryJson[i].y,
                    w: sceneryJson[i].w,
                    h: sceneryJson[i].h,
                    margin: 0,
                    frame_count: sceneryJson[i].framecount,
                    animation_type_id: 1
                });

                spriteFrame.anchor = {x: sceneryJson[i].anchorX, y: sceneryJson[i].anchorY};

                //Game.sceneryMap.set(sceneryJson[i].id, spriteFrame);

                // save the instances to the multimap
                for (var j = 0; j < sceneryJson[i].instances.length; ++j) {
                    var xy = tileIdToXY(sceneryJson[i].instances[j]);
                    if (!this.sceneryInstances.has(xy.y))
                        this.sceneryInstances.set(xy.y, []);
                    this.sceneryInstances.get(xy.y).push({x: xy.x, sprite: spriteFrame});
                }
            }

            // console.log(this.sceneryInstances.get(16.0));
            // console.log(this.sceneryInstances.get(16).filter(obj => obj.x > 3000 && obj.x < 4000));
            // // order each list by x pos
            // this.sceneryInstances.forEach(function(value, key, map) {
            //     value.sort((a, b) => parseFloat(a.x) - parseFloat(b.x));
            // });
            // console.log(this.sceneryInstances.get(16));
        },
        addPlayer: function (obj) {
            if (obj["id"] != this.player.id) {
                var player = new Game.Player(obj["tileId"]);
                player.currentHp = obj["currentHp"];
                player.maxHp = obj["maxHp"];
                player.id = obj["id"];
                player.name = obj["name"];
                player.setAnimations(obj["animations"]);
                this.otherPlayers.push(player);
            }
        },
        draw: function (ctx, xview, yview) {
            if (room.currentShow === 0)
                return;

            this.t.reset();
            ctx.save();

            this.t.scale(Game.scale, Game.scale);
            ctx.setTransform.apply(ctx, this.t.m);
            this.map.draw(ctx, xview, yview);

            ctx.save();// make the items on the ground smaller than in the inventory
            ctx.scale(0.5, 0.5);
            for (var i in this.groundItems)
                this.groundItems[i].draw(ctx, xview, yview, 0.5, 0.5);
            ctx.restore();

            var mp = Game.mousePos || { x: 0, y: 0 };
            var transformed = this.t.transformPoint(mp.x, mp.y);
            cursor.setPos({ x: transformed.x + xview, y: transformed.y + yview });
            if (!Game.ContextMenu.active && Game.worldCameraRect.pointWithin(Game.mousePos))
                cursor.draw(ctx, xview, yview);
            context.fillStyle = "#f00";

            // add everything to the draw map so we can draw in the correct order
            var drawMap = new Map();
            
            // add the current player
            if (!drawMap.has(this.player.y))
                drawMap.set(this.player.y, []);
            drawMap.get(this.player.y).push({x: this.player.x, sprite: this.player.getCurrentSpriteFrame()});

            // add the other players
            for (var i in this.otherPlayers) {
                if (!drawMap.has(this.otherPlayers[i].y))
                    drawMap.set(this.otherPlayers[i].y, []);
                drawMap.get(this.otherPlayers[i].y).push({x: this.otherPlayers[i].x, sprite: this.otherPlayers[i].getCurrentSpriteFrame()});
            }

            // TODO add the NPCs

            var drawBoundWidth = (camera.viewportRect.width * Game.maxScale);
            var drawBoundHeight = (camera.viewportRect.height * Game.maxScale);

            var minX = (xview + (camera.viewportRect.width * 0.5)) - (drawBoundWidth * 0.5); 
            var minY = (yview + (camera.viewportRect.height) * 0.5) - (drawBoundHeight * 0.5);
            
            // add the scenery
            this.sceneryInstances.forEach(function(value, key, map) {
                // camera.viewportRect.width * Game.scale, camera.viewportRect.height * Game.scale
                if (key > minY && key < minY + drawBoundHeight) {
                    if (!drawMap.has(key)) 
                        drawMap.set(key, []);

                    var filteredByXPos = value.filter(obj => obj.x > minX && obj.x < minX + drawBoundWidth);
                    drawMap.set(key, drawMap.get(key).concat(filteredByXPos));
                }
            });

            var orderedDrawMap = new Map([...drawMap.entries()].sort());// order by ypos
            orderedDrawMap.forEach(function(value, key, map) {
                for (var i = 0; i < value.length; ++i) {
                    value[i].sprite.draw(ctx, value[i].x - xview, key - yview);
            }});

            // player-draw still draws stuff like the death curtain, health bars, chat etc so draw these last.
            this.player.draw(ctx, xview, yview);
            for (var i in this.otherPlayers) {
                this.otherPlayers[i].draw(ctx, xview, yview);
            }

            ctx.restore();
        },
        process: function (dt) {
            this.currentShow += (this.show - this.currentShow) * dt;
            this.player.process(dt, this.width, this.height);
            for (var i in this.otherPlayers) {
                this.otherPlayers[i].process(dt, this.width, this.height);
            }
            Game.Minimap.setOtherPlayers(this.otherPlayers);
            Game.Minimap.setGroundItems(this.groundItems);
        },
        removePlayer: function (id) {
            for (var i in this.otherPlayers) {
                if (this.otherPlayers[i].id == id) {
                    this.otherPlayers.splice(i, 1);
                    return;
                }
            }
        },
        updateGroundItems: function (groundItemArray) {
            this.groundItems = [];
            for (var i in groundItemArray) {
                var item = Game.SpriteManager.getItemById(groundItemArray[i].id);
                var xy = tileIdToXY(groundItemArray[i].tileId);
                this.groundItems.push(new Game.GroundItem(item, xy.x, xy.y, groundItemArray[i].groundItemId));
            }
        }
    };
    canvas.addEventListener("mousedown", function (e) {
        if (Game.state === 'game') {
            if (Game.getPlayer().inventory.rect.pointWithin(Game.mousePos)) {
                Game.getPlayer().inventory.onMouseDown(e.button);
            }
            else if (Game.Minimap.rect.pointWithin(Game.mousePos)) {
                Game.Minimap.onMouseDown(e.button);
            }
            else if (Game.worldCameraRect.pointWithin(Game.mousePos)) {
                switch (e.button) {
                    case 0: // left
                        if (!Game.ContextMenu.active) {
                            // TODO not necessarily move here; e.g. if you left click a ground item you should pick it up
                            Game.ws.send({ action: "move", id: room.player.id, x: ~~cursor.mousePos.x, y: ~~cursor.mousePos.y });
                        }
                        break;
                    case 2: // right
                        // take all the things that are at this position and add them to the context menu
                        if (Game.ContextMenu.active)
                            break;
                        // only check for the other players and ground items if the click was within the world rect
                        for (var i in room.otherPlayers) {
                            var p = room.otherPlayers[i];
                            if (p.clickBox.pointWithin(cursor.mousePos)) {
                                Game.ContextMenu.push(room.otherPlayers[i].contextMenuOptions());
                            }
                        }
                        for (var i in room.groundItems) {
                            var groundItem = room.groundItems[i];
                            if (groundItem.clickBox.pointWithin(cursor.mousePos)) {
                                Game.ContextMenu.push([{
                                        action: "take",
                                        objectName: groundItem.item.name,
                                        groundItemId: groundItem.groundItemId
                                    }]);
                            }
                        }
                        break;
                }
            }
            // all cases
            switch (e.button) {
                case 0: // left
                    if (Game.ContextMenu.active)
                        Game.ContextMenu.handleMenuSelect();
                    break;
                case 2: // right
                    if (!Game.ContextMenu.active)
                        Game.ContextMenu.show(~~cursor.mousePos.x, ~~cursor.mousePos.y, ~~camera.xView, ~~camera.yView);
                    break;
            }
        }
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        if (Game.state === 'game') {
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
    var stone = new Image();
    stone.src = "img/stone.jpg";
    stone.onload = function () {
        hudcamera.pat = context.createPattern(stone, "repeat");
    };
    // setup the magic camera !!!
    var camera = new Game.Camera(room.player.x, room.player.y, canvas.width - 250, canvas.height, room.map.width, room.map.height);
    Game.worldCameraRect = new Game.Rectangle(0, 0, canvas.width - 250, canvas.height);
    var hudcamera = new Game.Camera(camera.viewportRect.width, 0, canvas.width - camera.viewportRect.width, canvas.height);
    Game.hudCameraRect = new Game.Rectangle(camera.viewportRect.width, 0, canvas.width - camera.viewportRect.width, canvas.height);
    Game.Minimap.setRect(hudcamera.viewportRect.left + 10, hudcamera.viewportRect.top + 10, 230, 230);
    Game.currentMap = room.map;
    var cursor = new Game.Cursor((hudcamera.xView + hudcamera.wView) - 10, hudcamera.yView + 20);
    var grid = new Game.Grid();
    grid.createGridLines(camera.viewportRect.width, camera.viewportRect.height);
    // Game update function
    var update = function () {
        if (Game.state === 'game') {
            Game.scale += (Game.targetScale - Game.scale) * STEP * 10;
            room.process(STEP);
            camera.update(STEP);
            Game.ChatBox.process(STEP);
            Game.ContextMenu.process(STEP);
        }
        else if (Game.state === 'logonscreen') {
            Game.LogonScreen.process(STEP);
        }
    };
    var counter = 0;
    // Game draw function
    var draw = function () {
        if (Game.state === 'game') {
            // redraw all room objects
            context.fillStyle = "#000";
            context.fillRect(0, 0, camera.viewportRect.width * Game.scale, camera.viewportRect.height * Game.scale);
            room.draw(context, camera.xView, camera.yView);
            // redraw all hud objects
            context.fillStyle = hudcamera.pat || "black";
            context.fillRect(hudcamera.xView, hudcamera.yView, hudcamera.viewportRect.width, hudcamera.viewportRect.height);
            Game.Minimap.draw(context, camera.xView, camera.yView);
            room.player.inventory.draw(context, hudcamera.xView, hudcamera.yView + Game.Minimap.height + 20);
            room.player.stats.draw(context, hudcamera.xView, hudcamera.viewportRect.height - ((room.player.stats.stats.length + 2) * room.player.stats.y));
            if (room.currentShow <= 0.98) {
                // fade out the logon screen background
                context.save();
                context.globalAlpha = 1 - room.currentShow;
                context.drawImage(Game.LogonScreen.bkg, 0, 0, Game.LogonScreen.bkg.width, Game.LogonScreen.bkg.height);
                context.restore();
            }
            Game.ChatBox.draw(context, 0, canvas.height);
            Game.ContextMenu.draw(context);
        }
        else if (Game.state === 'logonscreen') {
            Game.LogonScreen.draw(context, canvas.width, canvas.height);
        }
    };
    // Game Loop
    var gameLoop = function () {
        update();
        draw();
    };
    // I'll use setInterval instead of requestAnimationFrame for compatibility reason,
    // but it's easy to change that.
    var runningId = -1;
    Game.play = function () {
        if (runningId === -1) {
            runningId = setInterval(function () {
                gameLoop();
            }, INTERVAL);
            console.log("play");
        }
    };
    Game.getPlayer = function () {
        return room.player;
    };

    Game.play();
    // -->
});
Game.getMousePos = function (e) {
    return { x: e.clientX - Game.boundingRect.left, y: e.clientY - Game.boundingRect.top };
};
window.addEventListener("mousemove", function (e) {
    Game.mousePos = Game.getMousePos(e);
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
    if (Game.state === 'logonscreen') {
        Game.LogonScreen.onKeyDown(event.keyCode);
        return;
    }
    else if (Game.state === 'game') {
        switch (event.keyCode) {
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
                    console.log("sending message: ", Game.ChatBox.userMessage);
                    Game.ws.send({
                        action: "message",
                        id: Game.getPlayer().id,
                        message: Game.ChatBox.userMessage
                    });
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
// -->