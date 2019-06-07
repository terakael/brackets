$(function () {
    // prepare our game canvas
    var canvas = document.getElementById("game"), context = canvas.getContext("2d"), ip = "localhost", port = "45555", resourcePort = "45556";
    Game.resourceWs = new Game.WebSocket("ws://{0}:{1}/ws/resources".format(ip, resourcePort), function (obj) {
        if (obj["success"] == 0) {

        } else {
            
            if (obj["action"] === "cached_resources") {
                Game.SpriteManager.loadSpriteMaps(obj["spriteMaps"]);
                Game.SpriteManager.loadSpriteFrames(obj["spriteFrames"]);
                Game.SpriteManager.loadItems(obj["items"]);
                Game.ContextMenu.loadContextOptions(obj["contextOptions"]);
                room.loadScenery(obj["scenery"]);
                Game.statMap = new Map(Object.entries(obj["statMap"]));
            }
        }
    });

    Game.resourceWs.ws.onopen = function() {
        // get the initial resources for the game (sprite maps, scenery etc)
        Game.resourceWs.send({
            action: "resources",
            id: 0
        });
    };
    Game.resourceWs.ws.onclose = function() {
        console.log("loaded resources");
    };
    Game.connectAndLogin = function(username, password) {
        Game.ws = new Game.WebSocket("ws://{0}:{1}/ws/game".format(ip, port), Game.processResponse);

        Game.ws.ws.onopen = function() {
            Game.ws.send({
                action: "logon",
                name: username,
                password: password
            });
        };

        Game.ws.ws.onclose = function() {
            room.otherPlayers = [];
            room.player = null;
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
                if (obj.responseText.length > 0 && Game.state === "game") {
                    Game.ChatBox.add(obj.responseText, obj.messageColour);
                }

                if (obj["action"] === "logon") {

                    for (var i in obj.players) {
                        if (obj.players[i].id === obj.id) {
                            document.title = obj.players[i].name;

                            room.player = new Game.Player(obj["tileId"]);
                            room.player.id = obj.id;
                            room.player.name = obj.players[i].name;
                            room.player.currentHp = obj.players[i].currentHp;
                            room.player.maxHp = obj.players[i].maxHp;

                            camera.follow(room.player, (canvas.width - 250 - (room.player.width / 2)) / 2, (canvas.height) / 2);

                            var playerXY = tileIdToXY(obj["tileId"]);
                            camera.xView = playerXY.x - (camera.xDeadZone * (1 / Game.scale));
                            camera.yView = playerXY.y - (camera.yDeadZone * (1 / Game.scale));
                        } else 
                            room.addPlayer(obj.players[i]);
                    }
                    
                    room.player.loadStats(obj["stats"]);
                    room.player.loadInventory(obj["inventory"]);
                    room.player.setAnimations(obj["animations"]);
                    room.player.loadAttackStyles(obj["attackStyles"]);
                    room.player.setAttackStyle(obj["attackStyleId"]);
                    
                    room.updateGroundItems(obj["groundItems"]);
                    
                    
                    room.loadBackground(Game.SpriteManager.getSpriteMapByName("grass"));
                    room.init();

                    Game.ChatBox.add("Welcome to the game, {0}.".format(room.player.name));
                    Game.state = 'game';
                    Game.currentPlayer = room.player;
                }
                else if (obj["action"] === "logoff") {
                    // clean up and change state to logon screen
                    room.player = null;
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
                else if (obj["action"] === "examine") {
                    Game.ChatBox.add(obj["examineText"], "#fff");
                }
                else if (obj["action"] === "playerEnter") {
                    room.addPlayer(obj);
                    Game.ChatBox.add(obj.name + " has logged in.", "#0ff");
                }
                else if (obj["action"] === "playerLeave") {
                    room.removePlayer(obj["id"]); // TODO should be session id; this is dangerous
                    Game.ChatBox.add(obj["name"] + " has logged out.", "#0ff");
                }
                else if (obj["action"] === "addexp") {
                    for (var key in obj["stats"]) {
                        room.player.stats.gainExp(Game.statMap.get(key), obj.stats[key]);
                    }
                }
                else if (obj["action"] === "unknown") {
                    Game.ChatBox.add("invalid action.", "#fff");
                }
                else if (obj["action"] === "dead") {
                    if (obj.id === room.player.id) {
                        // you died lmfao
                        room.player.respawn(obj["tileId"], obj["currentHp"]);
                        room.player.setDeathSequence();
                    } else {
                        for (var i in room.otherPlayers) {
                            if (obj.id === room.otherPlayers[i].id) {
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
                    room.player.setBonuses(obj["bonuses"]);
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
                    if (fighter1 && fighter2)
                        Game.FightManager.addFight(fighter1, fighter2);
                }
                else if (obj["action"] === "player_update") {
                    if (obj["id"] == room.player.id) {
                        room.player.handlePlayerUpdate(obj);
                    } else {
                        for (var i in room.otherPlayers) {
                            if (obj["id"] == room.otherPlayers[i].id) {
                                room.otherPlayers[i].handlePlayerUpdate(obj);
                            }
                        }
                    }
                }
                else if (obj["action"] === "start_mining") {
                    Game.ChatBox.add("you start mining the rock...");
                }
                else if (obj["action"] === "finish_mining") {
                    // keep mining automatically
                    Game.ws.send({
                        action: "mine",
                        tileId: obj["tileId"]
                    });
                }
                else if (obj["action"] === "show_smithing_table") {
                    Game.activeUiWindow = uiWindow;

                    var buttons = [];
                    for (var i = 0; i < obj["smithingOptions"].length; ++i) {
                        buttons.push(new Game.UIButton(obj["smithingOptions"][i]));
                    }
                    uiWindow.setButtons(buttons.sort((a, b) => a.buttonInfo.level - b.buttonInfo.level));
                    uiWindow.otherInfo = {
                        storedCoal: obj["storedCoal"],
                        furnaceTile: obj["furnaceTile"]
                    };
                }
                else if (obj["action"] === "npc_full_update") {
                    for (var i in obj["npcs"]) {
                        room.addNPC(obj["npcs"][i]);
                    }
                }
                else if (obj["action"] === "npc_update") {
                    let foundNpc = false;
                    for (var i = 0; i < room.npcs.length; ++i) {
                        if (room.npcs[i].instanceId === obj["instanceId"]) {
                            room.npcs[i].handleNpcUpdate(obj)
                            foundNpc = true;
                            break;
                        }
                    }

                    if (!foundNpc && obj.npc)
                        room.addNPC(obj.npc);

                    // clear out any dead npcs (they are re-added when the server respawns them)
                    room.npcs = room.npcs.filter(e => e.currentHp > 0);
                }
                else if (obj["action"] === "pvm_start") {
                    let player = null, monster = null;
                    if (obj.playerId == Game.currentPlayer.id) {
                        player = Game.currentPlayer;
                    } else {
                        for (var i in room.otherPlayers) {
                            if (room.otherPlayers[i].id == obj.playerId) {
                                player = room.otherPlayers[i];
                                break;
                            }
                        }
                    }

                    for (var i = 0; i < room.npcs.length; ++i) {
                        if (room.npcs[i].instanceId === obj.monsterId) {
                            monster = room.npcs[i];
                            break;
                        }
                    }

                    if (player !== null && monster !== null) {
                        // handle fight
                        player.setDestPosAndSpeedByTileId(obj.tileId, -12);
                        player.inCombat = true;
                        
                        monster.setDestPosAndSpeedByTileId(obj.tileId, 12);
                        monster.inCombat = true;
                    }
                }
                else if (obj["action"] === "pvm_end") {
                    let player = null;
                    if (obj.playerId == Game.currentPlayer.id) {
                        player = Game.currentPlayer;
                    } else {
                        for (var i in room.otherPlayers) {
                            if (room.otherPlayers[i].id == obj.playerId) {
                                player = room.otherPlayers[i];
                                break;
                            }
                        }
                    }
                    if (player != null) {
                        player.inCombat = false;
                        player.setDestPosAndSpeedByTileId(obj.playerTileId);
                    }

                    for (var i = 0; i < room.npcs.length; ++i) {
                        if (room.npcs[i].instanceId === obj.monsterId) {
                            room.npcs[i].inCombat = false;
                            room.npcs[i].setDestPosAndSpeedByTileId(obj.monsterTileId);
                            break;
                        }
                    }
                }
                else if (obj["action"] === "pvp_start") {
                    let player1 = null, player2 = null;
                    if (obj.player1Id == Game.currentPlayer.id) {
                        player1 = Game.currentPlayer;
                    } else {
                        for (var i in room.otherPlayers) {
                            if (room.otherPlayers[i].id == obj.player1Id) {
                                player1 = room.otherPlayers[i];
                                break;
                            }
                        }
                    }

                    if (obj.player2Id == Game.currentPlayer.id) {
                        player2 = Game.currentPlayer;
                    } else {
                        for (var i in room.otherPlayers) {
                            if (room.otherPlayers[i].id == obj.player2Id) {
                                player2 = room.otherPlayers[i];
                                break;
                            }
                        }
                    }

                    if (player1 !== null && player2 !== null) {
                        // handle fight
                        player1.setDestPosAndSpeedByTileId(obj.tileId, -12);
                        player1.inCombat = true;
                        
                        player2.setDestPosAndSpeedByTileId(obj.tileId, 12);
                        player2.inCombat = true;
                    }
                }
                else if (obj["action"] === "pvp_end") {
                    let player1 = null;
                    if (obj.player1Id == Game.currentPlayer.id) {
                        player1 = Game.currentPlayer;
                    } else {
                        for (var i in room.otherPlayers) {
                            if (room.otherPlayers[i].id == obj.player1Id) {
                                player1 = room.otherPlayers[i];
                                break;
                            }
                        }
                    }
                    if (player1 != null) {
                        player1.inCombat = false;
                        player1.setDestPosAndSpeedByTileId(obj.playerTileId);
                    }

                    let player2 = null;
                    if (obj.player2Id == Game.currentPlayer.id) {
                        player2 = Game.currentPlayer;
                    } else {
                        for (var i in room.otherPlayers) {
                            if (room.otherPlayers[i].id == obj.player2Id) {
                                player2 = room.otherPlayers[i];
                                break;
                            }
                        }
                    }
                    if (player2 != null) {
                        player2.inCombat = false;
                        player2.setDestPosAndSpeedByTileId(obj.player2TileId);
                    }
                }
                else if (obj["action"] === "toggle_attack_style") {
                    Game.currentPlayer.setAttackStyle(obj.attackStyleId);
                }
                else if (obj["action"] === "talk to") {
                    for (let i = 0; i < room.npcs.length; ++i) {
                        if (room.npcs[i].instanceId === obj["objectId"]) {
                            room.npcs[i].setChatMessage(obj["message"]);
                            break;
                        }
                    }
                }

            }
        }
    }

    Game.mousePos = { x: 0, y: 0 };
    Game.boundingRect = canvas.getBoundingClientRect();
    Game.state = 'logonscreen';
    Game.scale = 1.5;
    Game.targetScale = 1.5;
    Game.maxScale = 2;
    Game.minScale = 1;
    Game.sceneryMap = new Map();
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
        npcs: [],
        sceneryInstances: new Map(),
        drawableSceneryMap: new Map(),
        drawableNpcs: [],
        t: new Game.Transform(),
        loadBackground: function(background) {
            this.map.load(context, background);
            Game.Minimap.bakeMinimap(this.map.image, this.sceneryInstances);
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

                Game.sceneryMap.set(sceneryJson[i].id, {
                    id: sceneryJson[i].id,
                    name: sceneryJson[i].name,
                    leftclickOption: sceneryJson[i].leftclickOption,
                    otherOptions: sceneryJson[i].otherOptions
                });

                // save the instances to the multimap
                for (var j = 0; j < sceneryJson[i].instances.length; ++j) {
                    var xy = tileIdToXY(sceneryJson[i].instances[j]);
                    if (!this.sceneryInstances.has(xy.y))
                        this.sceneryInstances.set(xy.y, []);

                    this.sceneryInstances.get(xy.y).push({
                        id: sceneryJson[i].id,
                        name: sceneryJson[i].name,
                        x: xy.x, 
                        tileId: sceneryJson[i].instances[j], 
                        leftclickOption: sceneryJson[i].leftclickOption,
                        sprite: spriteFrame,
                        type: "scenery"
                    });
                }
            }
        },
        addPlayer: function (obj) {
            var player = new Game.Player(obj.tileId);
            player.id = obj.id;
            player.name = obj.name;

            player.currentHp = obj.currentHp;
            player.maxHp = obj.maxHp;
            player.combatLevel = obj.combatLevel;
            
            player.setAnimations(obj.animations);

            this.otherPlayers.push(player);
        },
        addNPC: function(obj) {
            var npc = new Game.NPC(obj);
            this.npcs.push(npc);
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
            for (var i in this.groundItems) {
                this.groundItems[i].draw(ctx, xview, yview, 0.5, 0.5);
            }
            ctx.restore();

            if (Game.activeUiWindow == null) {// if there's a window up then don't show hover texts for items behind it
                for (var i in this.groundItems) {
                    var rect = new Game.Rectangle(
                        this.groundItems[i].clickBox.left - xview, 
                        this.groundItems[i].clickBox.top - yview, 
                        this.groundItems[i].clickBox.width, this.groundItems[i].clickBox.height);

                    if (rect.pointWithin({x: Game.mousePos.x / Game.scale, y: Game.mousePos.y / Game.scale}) &&
                        Game.worldCameraRect.pointWithin(Game.mousePos)) {
                        // if there's a slot in use then show nothing; you cannot use an inv item on a ground item.
                        // this means don't even show the usual "take" option; the current state is a use inv item on something
                        if (Game.currentPlayer.inventory.slotInUse == null) {
                            // { action: "take", objectName: groundItem.item.name, groundItemId: groundItem.groundItemId }
                            Game.ContextMenu.setLeftclick(Game.mousePos, {
                                id: Game.currentPlayer.id,
                                action: "take", 
                                objectName: this.groundItems[i].item.name, 
                                groundItemId: this.groundItems[i].groundItemId
                            });
                        }
                    }
                }
            }
            
            // add everything to the draw map so we can draw in the correct order
            var drawMap = new Map();
            
            // add the current player
            if (!drawMap.has(this.player.y))
                drawMap.set(this.player.y, []);
            drawMap.get(this.player.y).push({
                id: this.player.id,
                name: this.player.name,
                x: this.player.x, 
                sprite: this.player.getCurrentSpriteFrame(),
                type: "player",
                leftclickOption: 0
            });

            // add the other players
            for (var i in this.otherPlayers) {
                if (!drawMap.has(this.otherPlayers[i].y))
                    drawMap.set(this.otherPlayers[i].y, []);
                drawMap.get(this.otherPlayers[i].y).push({
                    id: this.otherPlayers[i].id,
                    name: this.otherPlayers[i].name,
                    x: this.otherPlayers[i].x, 
                    sprite: this.otherPlayers[i].getCurrentSpriteFrame(),
                    type: "player",
                    leftclickOption: 0
                });
            }

            // add the NPCs
            this.compileDrawableNpcs(xview, yview);
            for (var i in this.drawableNpcs) {
                if (!drawMap.has(this.drawableNpcs[i].pos.y))
                    drawMap.set(this.drawableNpcs[i].pos.y, []);
                drawMap.get(this.drawableNpcs[i].pos.y).push({
                    id: this.drawableNpcs[i].instanceId,
                    name: this.drawableNpcs[i].name,
                    x: this.drawableNpcs[i].pos.x, 
                    sprite: this.drawableNpcs[i].getCurrentSpriteFrame(),
                    type: "npc",
                    leftclickOption: this.drawableNpcs[i].leftclickOption,
                    label: this.drawableNpcs[i].getLeftclickLabel()
                });
            }

            // add scenery
            this.compileDrawableSceneryMap(xview, yview);
            this.drawableSceneryMap.forEach(function(value, key, map) {
                if (!drawMap.has(key))
                    drawMap.set(key, []);
                drawMap.set(key, drawMap.get(key).concat(value));
            });

            var orderedDrawMap = new Map([...drawMap.entries()].sort());// order by ypos
            orderedDrawMap.forEach(function(value, key, map) {
                for (var i = 0; i < value.length; ++i) { 
                    value[i].sprite.draw(ctx, value[i].x - xview, key - yview);
                    var currentFrame = value[i].sprite.getCurrentFrame();

                    if (Game.activeUiWindow == null) {
                        var rect = new Game.Rectangle(
                            value[i].x - xview - (value[i].sprite.anchor.x * currentFrame.width), 
                            key - yview - (value[i].sprite.anchor.y * currentFrame.height), 
                            currentFrame.width, currentFrame.height);

                        // mouse position needs to account for scale because the whole context is currently scaled
                        if (rect.pointWithin({x: Game.mousePos.x / Game.scale, y: Game.mousePos.y / Game.scale}) &&
                            Game.worldCameraRect.pointWithin(Game.mousePos)) {
                            if (Game.currentPlayer.inventory.slotInUse) {
                                Game.ContextMenu.setLeftclick(Game.mousePos, {
                                    id: Game.currentPlayer.id,
                                    action: "use",
                                    src: Game.currentPlayer.inventory.slotInUse.item.id,
                                    dest: value[i].tileId,
                                    type: value[i].type,
                                    label: "use {0} -> {1}".format(Game.currentPlayer.inventory.slotInUse.item.name, value[i].name)
                                });
                            } else {
                                if (value[i].leftclickOption != 0) {
                                    var label = value[i].label || "";
                                    var contextOpt = Game.ContextMenu.getContextOptionById(value[i].leftclickOption);
                                    Game.ContextMenu.setLeftclick(Game.mousePos, {
                                        id: Game.currentPlayer.id,
                                        action: contextOpt.name,
                                        objectName: value[i].name,
                                        objectId: value[i].id,
                                        tileId: value[i].tileId,
                                        type: value[i].type,
                                        label: label
                                    });
                                }
                            }
                        }
                    }
                }
            });

            // these draw calls still draw stuff like the death curtain, health bars, chat etc so draw these last.
            this.player.draw(ctx, xview, yview);
            for (var i in this.otherPlayers) {
                this.otherPlayers[i].draw(ctx, xview, yview);
            }

            for (var i in this.drawableNpcs) {
                this.drawableNpcs[i].draw(ctx, xview, yview);
            }

            var mp = Game.mousePos || { x: 0, y: 0 };
            var transformed = this.t.transformPoint(mp.x, mp.y);
            cursor.setPos({ x: transformed.x + xview, y: transformed.y + yview });
            cursor.draw(ctx, xview, yview);

            ctx.restore();
        },
        process: function (dt) {
            this.currentShow += (this.show - this.currentShow) * dt;
            this.player.process(dt, this.width, this.height);
            for (var i in this.otherPlayers) {
                this.otherPlayers[i].process(dt, this.width, this.height);
            }
            for (var i in this.drawableNpcs) {
                this.drawableNpcs[i].process(dt);
            }
            this.drawableSceneryMap.forEach(function(value, key, map) {
                for (var i in value)
                    value[i].sprite.process(dt);
            });
            Game.Minimap.setOtherPlayers(this.otherPlayers);
            Game.Minimap.setGroundItems(this.groundItems);
            Game.Minimap.setNpcs(this.drawableNpcs);
        },
        compileDrawableSceneryMap: function(xview, yview) {
            var drawBoundWidth = (camera.viewportRect.width * Game.maxScale);
            var drawBoundHeight = (camera.viewportRect.height * Game.maxScale);

            var minX = (xview + (camera.viewportRect.width * 0.5)) - (drawBoundWidth * 0.5); 
            var minY = (yview + (camera.viewportRect.height) * 0.5) - (drawBoundHeight * 0.5);
            
            // add the scenery
            var drawableSceneryMap = new Map();
            this.sceneryInstances.forEach(function(value, key, map) {
                if (key > minY && key < minY + drawBoundHeight) {
                    if (!drawableSceneryMap.has(key)) 
                        drawableSceneryMap.set(key, []);

                    var filteredByXPos = value.filter(obj => obj.x > minX && obj.x < minX + drawBoundWidth);
                    drawableSceneryMap.set(key, drawableSceneryMap.get(key).concat(filteredByXPos));
                }
            });
            this.drawableSceneryMap = drawableSceneryMap;
        },
        compileDrawableNpcs: function(xview, yview) {
            var drawBoundWidth = (camera.viewportRect.width * Game.maxScale);
            var drawBoundHeight = (camera.viewportRect.height * Game.maxScale);

            var minX = (xview + (camera.viewportRect.width * 0.5)) - (drawBoundWidth * 0.5); 
            var minY = (yview + (camera.viewportRect.height * 0.5)) - (drawBoundHeight * 0.5);
 
            this.drawableNpcs = this.npcs.filter(npc => 
                   npc.pos.x > minX && npc.pos.x < minX + drawBoundWidth 
                && npc.pos.y > minY && npc.pos.y < minY + drawBoundHeight);
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
        if (Game.activeUiWindow) {
            Game.activeUiWindow.onMouseDown(e);
        }

        else if (Game.state === 'game') {

            // TODO inventory, minimap, stats etc should all be contained within this
            if (Game.HUD.mouseWithin(Game.mousePos)) {
                Game.HUD.onMouseDown(e);
            } 

            if (Game.ContextMenu.active && e.button == 0) {// left
                var menuItem = Game.ContextMenu.handleMenuSelect();
                if (Game.getPlayer().inventory.rect.pointWithin(Game.mousePos)) {
                    Game.getPlayer().inventory.handleSlotAction(menuItem.action, menuItem.originalPos);
                }
            } 
            else if (Game.getPlayer().inventory.rect.pointWithin(Game.mousePos)) {
                Game.getPlayer().inventory.onMouseDown(e.button);
            } 
            else if (Game.Minimap.rect.pointWithin(Game.mousePos)) {
                Game.Minimap.onMouseDown(e.button);
            } 
            else if (Game.worldCameraRect.pointWithin(Game.mousePos)) {
                switch (e.button) {
                    case 0: // left
                        if (!Game.ContextMenu.active && room.player.inventory.slotInUse == null) {
                            if (Game.ContextMenu.leftclickMenuOption == null) {
                                // no stored leftclick option, so just move to the position
                                cursor.handleClick(false);
                                Game.ws.send({ action: "move", id: room.player.id, x: ~~cursor.mousePos.x, y: ~~cursor.mousePos.y });
                            } else {
                                // there's a stored leftclick option so perform the leftclick option
                                cursor.handleClick(true);
                                Game.ws.send(Game.ContextMenu.leftclickMenuOption);
                            }
                        } else if (room.player.inventory.slotInUse != null) {
                            // are we hovering over a player/scenery/npc?
                            room.drawableSceneryMap.forEach(function(value, key, map) {
                                for (var i in value) {
                                    var sprite = value[i].sprite;
                                    var spriteFrame = sprite.getCurrentFrame();
                                    var rect = new Game.Rectangle(
                                        value[i].x - (spriteFrame.width * sprite.anchor.x), 
                                        key - (spriteFrame.height * sprite.anchor.y), 
                                        spriteFrame.width, 
                                        spriteFrame.height);
    
                                    if (rect.pointWithin(cursor.mousePos)) {
                                        cursor.handleClick(true);
                                        var tileId = value[i].tileId;
                                        Game.ws.send({
                                            action: "use",
                                            id: room.player.id,
                                            src: room.player.inventory.slotInUse.item.id,
                                            dest: tileId,
                                            type: "scenery"
                                        });
                                        room.player.inventory.slotInUse = null;
                                        return;
                                    }
                                }
                            });
                            room.player.inventory.slotInUse = null;
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
                                Game.ContextMenu.push([
                                    { action: "take", objectName: groundItem.item.name, groundItemId: groundItem.groundItemId },
                                    { action: "examine", objectName: groundItem.item.name, objectId: groundItem.item.id, type: "item" }
                                ]);
                            }
                        }
                        room.drawableSceneryMap.forEach(function(value, key, map) {
                            for (var i in value) {
                                var sprite = value[i].sprite;
                                var spriteFrame = sprite.getCurrentFrame();
                                var rect = new Game.Rectangle(
                                    value[i].x - (spriteFrame.width * sprite.anchor.x), 
                                    key - (spriteFrame.height * sprite.anchor.y), 
                                    spriteFrame.width, 
                                    spriteFrame.height);

                                if (rect.pointWithin(cursor.mousePos)) {
                                    var tileId = value[i].tileId;
                                    var scenery = Game.sceneryMap.get(sprite.id);
                                    
                                    if (room.player.inventory.slotInUse) {
                                        Game.ContextMenu.push([{
                                            id: room.player.id,
                                            action: "use",
                                            src: room.player.inventory.slotInUse.item.id,
                                            dest: tileId,
                                            type: "scenery",
                                            label: "use {0} -> {1}".format(room.player.inventory.slotInUse.item.name, scenery.name)
                                        }]);
                                    } else {
                                        // add the leftclick option first (if there is one)
                                        if (scenery.leftclickOption != 0) {
                                            Game.ContextMenu.push([{
                                                action: Game.ContextMenu.getContextOptionById(scenery.leftclickOption).name,
                                                objectId: scenery.id,
                                                tileId: tileId,
                                                objectName: scenery.name,
                                                type: "scenery"
                                            }]);
                                        }
                                        for (var i = 0; i < Game.ContextMenu.contextOptions.length; ++i) {
                                            var contextOption = Game.ContextMenu.contextOptions[i];
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
                                    }
                                }
                            }
                        });

                        for (let i = 0; i < room.npcs.length; ++i) {
                            let npc = room.npcs[i];
                            var spriteFrame = room.npcs[i].getCurrentSpriteFrame();
                                var rect = new Game.Rectangle(
                                    npc.pos.x - (spriteFrame.getCurrentFrame().width * spriteFrame.anchor.x), 
                                    npc.pos.y - (spriteFrame.getCurrentFrame().height * spriteFrame.anchor.y), 
                                    spriteFrame.getCurrentFrame().width, 
                                    spriteFrame.getCurrentFrame().height);

                                if (rect.pointWithin(cursor.mousePos)) {
                                    if (npc.leftclickOption != 0) {
                                        Game.ContextMenu.push([{
                                            action: Game.ContextMenu.getContextOptionById(npc.leftclickOption).name,
                                            objectId: npc.instanceId,
                                            objectName: npc.name,
                                            type: "npc",
                                            label: npc.getLeftclickLabel()
                                        }]);
                                    }

                                    for (var j = 0; j < Game.ContextMenu.contextOptions.length; ++j) {
                                        var contextOption = Game.ContextMenu.contextOptions[j];
                                        if (npc.otherOptions & contextOption.id) {
                                            Game.ContextMenu.push([{
                                                action: contextOption.name, 
                                                objectId: npc.instanceId, 
                                                objectName: npc.name, 
                                                type: "npc"
                                            }]);
                                        }
                                    }
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
                        Game.ContextMenu.show(~~cursor.mousePos.x, ~~cursor.mousePos.y, ~~camera.xView, ~~camera.yView);
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
    var stone = new Image();
    stone.src = "img/stone.jpg";
    stone.onload = function () {
        hudcamera.pat = context.createPattern(stone, "repeat");
        uiWindow.background = hudcamera.pat;
    };
    // setup the magic camera !!!
    var camera = new Game.Camera(room.player.x, room.player.y, canvas.width - 250, canvas.height, room.map.width, room.map.height);
    Game.worldCameraRect = new Game.Rectangle(0, 0, canvas.width - 250, canvas.height);
    var hudcamera = new Game.Camera(camera.viewportRect.width, 0, canvas.width - camera.viewportRect.width, canvas.height);
    Game.hudCameraRect = new Game.Rectangle(camera.viewportRect.width, 0, canvas.width - camera.viewportRect.width, canvas.height);
    Game.HUD = new Game.HeadsUpDisplay(Game.hudCameraRect);

    Game.Minimap.setRect(hudcamera.viewportRect.left + 10, hudcamera.viewportRect.top + 10, 230, 230);
    Game.currentMap = room.map;
    var cursor = new Game.Cursor((hudcamera.xView + hudcamera.wView) - 10, hudcamera.yView + 20);
    var grid = new Game.Grid();
    grid.createGridLines(camera.viewportRect.width, camera.viewportRect.height);

    var uiWidth = (canvas.width - 250) / 2;
    var uiHeight = canvas.height / 2;
    var uix = uiWidth - (uiWidth / 2);
    var uiy = uiHeight - (uiHeight / 2);
    var uiWindow = new Game.UIWindow(new Game.Rectangle(uix, uiy, uiWidth, uiHeight), hudcamera.pat);
    
    // Game update function
    var update = function () {
        if (Game.state === 'game') {
            Game.ContextMenu.setLeftclick(null, null);

            Game.scale += (Game.targetScale - Game.scale) * STEP * 10;
            room.process(STEP);
            cursor.process(STEP);
            camera.update(STEP);
            Game.ChatBox.process(STEP);
            Game.HUD.process(STEP);

            if (Game.activeUiWindow)
                Game.activeUiWindow.process(STEP);

            Game.ContextMenu.process(STEP);
        }
        else if (Game.state === 'logonscreen') {
            Game.LogonScreen.process(STEP);
        }
    };

    // Game draw function
    var draw = function () {
        if (Game.state === 'game' || Game.state === 'uiwindow') {
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
            Game.HUD.draw(context);
            
            if (room.currentShow <= 0.98) {
                // fade out the logon screen background
                context.save();
                context.globalAlpha = 1 - room.currentShow;
                context.drawImage(Game.LogonScreen.bkg, 0, 0, Game.LogonScreen.bkg.width, Game.LogonScreen.bkg.height);
                context.restore();
            }
            Game.ChatBox.draw(context, 0, canvas.height);

            if (Game.activeUiWindow)
                Game.activeUiWindow.draw(context);
            
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