$(function () {
    // prepare our game canvas
    const canvas = document.getElementById("game");
    const context = canvas.getContext("2d");
    Game.context = context;
    const ip = "localhost", port = "45555", resourcePort = "45556";

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const otherCanvas = document.createElement("canvas");
    otherCanvas.width = canvas.width;
    otherCanvas.height = canvas.height
    Game.otherContext = otherCanvas.getContext("2d");
    
    Game.resourceWs = new Game.WebSocket("ws://{0}:{1}/ws/resources".format(ip, resourcePort), function (obj) {
        if (obj["success"] == 0) {

        } else {
            if (obj["action"] === "cached_resources") {
                Game.LogonScreen.loadingText = "loading resources...";
                Game.LogonScreen.draw(context, canvas.width, canvas.height);
                Game.SpriteManager.loadSpriteMaps(obj["spriteMaps"]).done(function() {
                    Game.SpriteManager.loadSpriteFrames(obj["spriteFrames"]);
                    Game.SpriteManager.loadItems(obj["items"]);
                    Game.SpriteManager.loadGroundTextures(obj["groundTextures"]);
                    room.loadTextureMaps();
                    Game.ContextMenu.loadContextOptions(obj["contextOptions"]);
                    room.loadNpcs(obj.npcs);
                    Game.statMap = new Map(Object.entries(obj["statMap"]));

                    for (let i = 0; i < obj.scenery.length; ++i)
                        Game.sceneryMap.set(obj.scenery[i].id, obj.scenery[i]);

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

                switch (obj.action) {
                    case "logon": {
                        document.title = obj.playerDto.name;
                        room.player = new Game.Player(obj.playerDto.tileId);
                        room.player.id = obj.playerDto.id;
                        room.player.name = obj.playerDto.name;
                        room.player.currentHp = obj.playerDto.currentHp;
                        room.player.maxHp = obj.playerDto.maxHp;
                        room.player.combatLevel = obj.playerDto.combatLevel;
                        room.player.currentPrayer = obj.playerDto.currentPrayer;

                        camera.follow(room.player, (canvas.width - 250 - (room.player.width / 2)) / 2, (canvas.height) / 2);

                        var playerXY = tileIdToXY(obj.playerDto.tileId);
                        camera.xView = playerXY.x - (camera.xDeadZone * (1 / Game.scale));
                        camera.yView = playerXY.y - (camera.yDeadZone * (1 / Game.scale));
                        
                        room.player.loadStats(obj.stats, obj.boosts);
                        room.player.setBonuses(obj.bonuses);
                        room.player.updateInventory(obj.inventory);
                        room.player.setAnimations(obj.playerDto.baseAnimations);
                        room.player.setEquipAnimations(obj.playerDto.equipAnimations);
                        room.player.setEquippedSlots(obj.equippedSlots);
                        room.player.loadAttackStyles(obj.attackStyles);
                        room.player.setAttackStyle(obj.playerDto.attackStyleId);
                        
                        room.init();

                        Game.ChatBox.add("Welcome to the game, {0}.".format(room.player.name));
                        Game.state = 'game';
                        Game.currentPlayer = room.player;
                        break;
                    }
                    
                    case "logoff": {
                        // clean up and change state to logon screen
                        room.player = null;
                        room.otherPlayers = [];
                        Game.state = 'logonscreen';
                        break;
                    }

                    case "message": {
                        if (obj["message"]) {
                            Game.ChatBox.add("{0}: {1}".format(obj.name, obj.message), obj.colour == null ? 'yellow' : obj.colour);
                            if (obj.id == room.player.id) {
                                room.player.setChatMessage(obj.message);
                            }
                            else {
                                for (var i in room.otherPlayers) {
                                    if (obj.id == room.otherPlayers[i].id) {
                                        room.otherPlayers[i].setChatMessage(obj.message);
                                    }
                                }
                            }
                        }
                        break;
                    }
                    
                    case "examine": {
                        Game.ChatBox.add(obj["examineText"], "#fff");
                        break;
                    }

                    case "playerEnter": {
                        Game.ChatBox.add(obj.name + " has logged in.", "#0ff");
                        break;
                    }

                    case "playerLeave": {
                        Game.ChatBox.add(obj["name"] + " has logged out.", "#0ff");
                        break;
                    }

                    case "addexp": {
                        for (var key in obj["stats"])
                            room.player.stats.gainExp(Game.statMap.get(key), obj.stats[key]);
                        break;
                    }

                    case "dead": {
                        if (obj.id === room.player.id) {
                            room.player.setDeathSequence();
                        } else {
                            for (let i in room.otherPlayers) {
                                if (obj.id === room.otherPlayers[i].id) {
                                    room.otherPlayers[i].setDeathSequence();
                                    break;
                                }
                            }
                        }
                        break;
                    }

                    case "invmove":
                    case "invupdate": {
                        room.player.updateInventory(obj["inventory"]);
                        room.player.setEquippedSlots(obj["equippedSlots"]);
                        break;
                    }

                    case "equip": {
                        room.player.setEquippedSlots(obj["equippedSlots"]);
                        room.player.setBonuses(obj["bonuses"]);
                        room.player.setEquipAnimations(obj["equipAnimations"]);
                        break;
                    }

                    case "duel": {
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
                        break;
                    }

                    case "accept_trade": {// both players have agreed to trade with eachother
                        // let gameWindowWidth = Game.canvas.width - 250;
                        // let uiWidth = gameWindowWidth / 1.25;
                        // let uiHeight = Game.canvas.height / 2;
                        // let uix = ~~((gameWindowWidth / 2) - (uiWidth / 2)) + 0.5;
                        // let uiy = ~~((Game.canvas.height / 2) - (uiHeight / 2)) + 0.5;
                        // let rect = new Game.Rectangle(uix, uiy, uiWidth, uiHeight);

                        let otherPlayerName = null;
                        for (let i in room.otherPlayers) {
                            if (room.otherPlayers[i].id === obj.otherPlayerId) {
                                otherPlayerName = room.otherPlayers[i].name;
                                break;
                            }
                        }

                        Game.activeUiWindow = new Game.TradeWindow(Game.worldCameraRect, otherPlayerName);
                        break;
                    }

                    case "accept_trade_offer": {// player clicks "accept" button in trade screen
                        if (Game.activeUiWindow.type === "trade") {
                            Game.activeUiWindow.handleAccept(obj)
                        }
                        break;
                    }

                    case "trade_update": {
                        if (Game.activeUiWindow.type !== "trade") {
                            Game.activeUiWindow = null;
                            break;
                        }

                        Game.activeUiWindow.update(obj);
                        
                        break;
                    }

                    case "cancel_trade": {
                        Game.activeUiWindow = null;
                        break;
                    }

                    case "player_update": {
                        if (obj.id === room.player.id) {
                            room.player.handlePlayerUpdate(obj);
                        } else {
                            for (var i in room.otherPlayers) {
                                if (obj.id === room.otherPlayers[i].id) {
                                    room.otherPlayers[i].handlePlayerUpdate(obj);
                                }
                            }
                        }
                        break;
                    }

                    case "start_mining": {
                        Game.ChatBox.add("you start mining the rock...");
                        break;
                    }

                    case "finish_mining": {
                        // keep mining automatically
                        Game.ws.send({
                            action: "mine",
                            tileId: obj["tileId"]
                        });
                        break;
                    }

                    case "start_fishing": {
                        Game.ChatBox.add("you start fishing...");
                        break;
                    }

                    case "finish_fishing": {
                        // keep mining automatically
                        Game.ws.send({
                            action: "fish",
                            tileId: obj["tileId"]
                        });
                        break;
                    }

                    case "start_smith": {
                        Game.ChatBox.add("you put the ore in the furnace...");
                        break;
                    }

                    case "finish_smith": {
                        Game.ws.send({
                            action: "smith",
                            itemId: obj.itemId
                        });
                        break;
                    }

                    case "start_use": {
                        break;
                    }

                    case "finish_use": {
                        // int src;
                        // int dest;
                        // String type;// what is the dest id's object type (scenery, item, player, npc)
                        // int srcSlot;
                        // int slot;

                        // TODO
                        Game.ws.send({
                            action: "use",
                            src: obj.src,
                            dest: obj.dest,
                            type: obj.type
                        });
                        break;
                    }

                    case "show_smithing_table": {
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
                        break;
                    }

                    case "npc_update": {
                        // instanceId: 32356
                        // damage: 22
                        // hp: 0
                        // success: 1
                        // responseText: ""
                        // action: "npc_update"
                        for (var i = 0; i < room.npcs.length; ++i) {
                            if (room.npcs[i].instanceId === obj["instanceId"]) {
                                room.npcs[i].handleNpcUpdate(obj)
                                break;
                            }
                        }
                        break;
                    }

                    case "pvm_start": {
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
                            player.inCombat = true;
                            player.setDestPosAndSpeedByTileId(obj.tileId, -8);
                            
                            monster.inCombat = true;
                            monster.setDestPosAndSpeedByTileId(obj.tileId);
                        }
                        break;
                    }

                    case "pvp_start": {
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
                            player1.inCombat = true;
                            player1.setDestPosAndSpeedByTileId(obj.tileId, -8);
                            
                            player2.inCombat = true;
                            player2.setDestPosAndSpeedByTileId(obj.tileId, 8);
                        }

                        break;
                    }

                    case "pvm_end": {
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
                            player.currentAnimation = player.attackingFromRight ? "left" : "right";
                            if (obj.playerTileId)
                                player.setDestPosAndSpeedByTileId(obj.playerTileId);
                        }

                        for (var i = 0; i < room.npcs.length; ++i) {
                            if (room.npcs[i].instanceId === obj.monsterId) {
                                room.npcs[i].inCombat = false;
                                room.npcs[i].setDestPosAndSpeedByTileId(obj.monsterTileId);
                                break;
                            }
                        }
                        break;
                    }

                    case "pvp_end": {
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
                            player1.currentAnimation = player1.attackingFromRight ? "left" : "right";

                            if (obj.playerTileId)
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
                            player2.currentAnimation = player2.attackingFromRight ? "left" : "right";

                            if (obj.player2TileId)
                                player2.setDestPosAndSpeedByTileId(obj.player2TileId);
                        }

                        break;
                    }

                    case "toggle_attack_style": {
                        Game.currentPlayer.setAttackStyle(obj.attackStyleId);
                        Game.ChatBox.add(`attack style switched to ${Game.currentPlayer.getCurrentAttackStyle()}.`);
                        break;
                    }

                    case "talk to": {
                        for (let i = 0; i < room.npcs.length; ++i) {
                            if (room.npcs[i].instanceId === obj["objectId"]) {
                                room.npcs[i].setChatMessage(obj["message"]);
                                break;
                            }
                        }
                        break;
                    }

                    case "npc_out_of_range": {
                        // console.log(obj);
                        // instances: [38602]
                        // success: 1
                        // responseText: ""
                        // action: "npc_out_of_range"
                        room.npcs = room.npcs.filter(e => !obj.instances.includes(e.instanceId));
                        break;
                    }

                    case "npc_in_range": {
                        // npcs: [{npcId, instanceId, tileId, currentHp}, {...}]
                        for (let i = 0; i < obj.npcs.length; ++i) {
                            room.npcs.push(new Game.NPC(obj.npcs[i]));
                        }
                        break;
                    }

                    case "player_out_of_range": {
                        // playerIds: [3, 2]
                        room.otherPlayers = room.otherPlayers.filter(e => !obj.playerIds.includes(e.id));
                        break;
                    }

                    case "player_in_range": {
                        // players: [{<player_update data>}, {...}]
                        for (let i = 0; i < obj.players.length; ++i) {
                            room.addPlayer(obj.players[i]);
                        }
                        break;
                    }

                    case "ground_item_in_range": {
                        for (let tileId in obj.groundItems) {
                            for (let i = 0; i < obj.groundItems[tileId].length; ++i)
                                room.groundItems.push(new Game.GroundItem(tileId, obj.groundItems[tileId][i]))
                        }
                        break;
                    }

                    case "ground_item_out_of_range": {
                        // [{"33333": [<itemId>, <itemId>, ...]}, {...}]
                        for (let tileId in obj.groundItems) {
                            for (let j = 0; j < obj.groundItems[tileId].length; ++j) {   
                                for (let i = 0; i < room.groundItems.length; ++i) {
                                    if (room.groundItems[i].tileId === tileId && room.groundItems[i].item.id === obj.groundItems[tileId][j]) {
                                        room.groundItems.splice(i, 1);
                                        break;
                                    }
                                }
                            }
                        }
                        
                        break;
                    }

                    case "dialogue": {
                        Game.activeUiWindow = obj.dialogue === "" ? null : new Game.DialogueWindow(Game.worldCameraRect, obj);
                        break;
                    }

                    case "dialogue_option": {
                        Game.activeUiWindow = new Game.DialogueOptionWindow(Game.worldCameraRect, obj.options);
                        break;
                    }

                    case "ground_item_refresh": {
                        room.refreshGroundItems(obj.groundItems);
                        break;
                    }

                    case "shop": {
                        Game.activeUiWindow = new Game.ShopWindow(Game.worldCameraRect, obj.shopStock, obj.shopName);
                        break;
                    }

                    case "show_stat_window": {
                        if (obj.statId === 8) {// potions
                            Game.activeUiWindow = new Game.PotionWindow(Game.worldCameraRect, obj.rows, "potions");
                        }
                        break;
                    }

                    case "bank": {
                        let gameWindowWidth = canvas.width - 250;
                        let uiWidth = gameWindowWidth / 2;
                        let uiHeight = canvas.height / 2;

                        let uix = ~~((gameWindowWidth / 2) - (uiWidth / 2)) + 0.5;
                        let uiy = ~~((canvas.height / 2) - (uiHeight / 2)) + 0.5;
                        let rect = new Game.Rectangle(uix, uiy, uiWidth, uiHeight);

                        Game.activeUiWindow = new Game.BankWindow(rect, obj.items, "the bank");
                        break;
                    }

                    case "withdraw":
                    case "deposit": {
                        Game.activeUiWindow.updateStock(obj.items);
                        break;
                    }

                    case "flower_respawn":
                    case "flower_deplete":
                    case "rock_respawn":
                    case "rock_deplete": {
                        let xy = tileIdToXY(obj.tileId);
                        let sceneryInstances = room.sceneryInstances.get(xy.y);
                        for (let i = 0; i < sceneryInstances.length; ++i) {
                            if (sceneryInstances[i].tileId === obj.tileId) {
                                sceneryInstances[i].sprite[0].nextFrame();
                                break;
                            }
                        }
                        break;
                    }
                    
                    case "stat_boosts": {
                        Game.currentPlayer.stats.setBoosts(obj.boosts);
                        break;
                    }

                    case "start_cooking": {
                        break;
                    }

                    case "finish_cooking": {
                        // lets cook again
                        Game.ws.send({
                            action: "use",
                            src: obj.itemId,
                            dest: obj.tileId,
                            type: obj.type
                        });
                        break;
                    }

                    case "catch": {
                        room.npcs = room.npcs.filter(e => e.instanceId !== obj.instanceId);
                        break;
                    }

                    case "action_bubble": {
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
                            player.setActionBubble(obj.iconId);
                        }

                        break;
                    }

                    case "cast_spell": {
                        let target = null;
                        if (obj.targetType === "npc") {
                            for (let i = 0; i < room.npcs.length; ++i) {
                                if (room.npcs[i].instanceId === obj.targetId) {
                                    target = room.npcs[i];
                                    break;
                                }
                            }
                        } else if (obj.targetType === "player") {
                            if (obj.targetId === room.player.id) {
                                target = Game.currentPlayer;
                            } else {
                                for (let i = 0; i < room.otherPlayers.length; ++i) {
                                    if (obj.targetId === room.otherPlayers[i].id) {
                                        target = room.otherPlayers[i];
                                        break;
                                    }
                                }
                            }
                        }

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
                        
                        if (target && player) {
                            let spell = new Game.Spell(player, target, obj.spriteFrameId);
                            room.spells.push(spell);

                            if (target === Game.currentPlayer)
                                Game.ChatBox.add(player.name + " is casting magic on you!", "#fff");
                        }
                        
                        break;
                    }
                    
                    case "add_ground_texture_instances": {
                        for (const [key, value] of Object.entries(obj.instances)) {
                            for (let i = 0; i < value.length; ++i) {
                                room.groundTextureInstances.set(value[i], key);
                            }
                        }

                        room.drawableTextureInstances = [];

                        let ordered = new Map([...room.groundTextureInstances.entries()].sort());
                        for (const [key, value] of ordered.entries()) {
                            room.drawableTextureInstances.push(Number(value));
                        }

                        room.updateGroundTextures();
                        break;
                    }

                    case "add_scenery_instances": {
                        for (const [sceneryId, tileIds] of Object.entries(obj.instances)) {
                            room.sceneryInstancesBySceneryId.set(sceneryId, tileIds.concat(room.sceneryInstancesBySceneryId.get(sceneryId) || []));
                        }
                        room.loadSceneryInstances();

                        room.addSceneryToCanvas(room.sceneryInstancesBySceneryId);

                        // once the scenery has reloaded, all the depleted scenery is back in its primary state.
                        // we need to go through each of the depleted scenery and toggle the depleted ones into their off state
                        if (obj.depletedScenery) {
                            for (let i = 0; i < obj.depletedScenery.length; ++i) {
                                let xy = tileIdToXY(obj.depletedScenery[i]);
                                let sceneryInstances = room.sceneryInstances.get(xy.y);
                                for (let j = 0; j < sceneryInstances.length; ++j) {
                                    if (sceneryInstances[j].tileId === obj.depletedScenery[i]) {
                                        sceneryInstances[j].sprite[0].nextFrame();
                                        break;
                                    }
                                }
                            }
                        }
                        break;
                    }
                    
                    case "remove_ground_texture_instances": {
                        for (let i = 0; i < obj.tileIds.length; ++i) {
                            room.groundTextureInstances.delete(obj.tileIds[i]);

                            for (let [sceneryId, tileIdList] of room.sceneryInstancesBySceneryId) {
                                let index = tileIdList.indexOf(obj.tileIds[i]);
                                if (index != -1)
                                    tileIdList.splice(index, 1);
                            }
                        }
                        break;
                    }

                    case "add_minimap_segments": {
                        for (const [segmentId, data] of Object.entries(obj.segments)) {
                            room.loadMinimap(data, Number(segmentId));
                        }
                        Game.Minimap.addMinimapIconLocations(obj.minimapIconLocations);
                        break;
                    }

                    case "remove_minimap_segments": {
                        for (let i = 0; i < obj.segments.length; ++i)
                            Game.Minimap.removeMinimapsBySegmentId(obj.segments[i]);
                        break;
                    }

                    case "teleport_explosion": {
                        let xy = tileIdToXY(obj.tileId);
                        room.teleportExplosions.push({
                            x: xy.x,
                            y: xy.y - 16,
                            lifetime: 1
                        });
                        
                        break;
                    }

                    case "load_prayers": {
                        Game.HUD.loadPrayers(obj.prayers);
                        break;
                    }

                    case "toggle_prayer": {
                        Game.HUD.setActivePrayers(obj.activePrayers);
                    }

                    // sometimes a response comes back just showing a message; don't do anything else in these cases
                    // we need these here though in order to prevent the "invalid action" default message.
                    case "use":
                    case "smith":
                    case "trade":                    
                    case "value":
                    case "buy":
                    case "pick":
                    case "pray at":
                    case "bury":
                        break;

                    default: {
                        Game.ChatBox.add("invalid action.", "#fff");
                        console.log(obj);
                        break;
                    }
                }
            }
        }
    }

    Game.mousePos = { x: 0, y: 0 };
    Game.boundingRect = canvas.getBoundingClientRect();
    Game.state = 'logonscreen';
    Game.scale = 3;
    Game.targetScale = 3;
    Game.maxScale = 3;
    Game.minScale = 2;
    Game.sceneryMap = new Map();
    Game.npcMap = new Map();
    Game.drawBoundingBoxes = false;
    Game.drawGroundTextureOutline = false;
    // game settings:	
    var FPS = 50, INTERVAL = 1000 / FPS, // milliseconds
    STEP = INTERVAL / 1000; // seconds
    // setup an object that represents the room
    var room = {
        player: {},
        show: 0,
        currentShow: 0,
        otherPlayers: [],
        npcs: [],
        sceneryInstances: new Map(),
        sceneryInstancesBySceneryId: new Map(),
        groundTextureInstances: new Map(),
        drawableTextureInstances: [],
        optimizedDrawableTextureInstance: new Map(),
        groundTexturesMap: new Map(),
        drawableSceneryMap: new Map(),
        spells: [],
        teleportExplosions: [], // [{x, y, lifetime}]
        groundItems: [],
        t: new Game.Transform(),
        loadMinimap: function(minimapBase64, segmentId) {
            let image = new Image();
            image.src = `data:image/png;base64,${minimapBase64}`;
            image.onload = () => Game.Minimap.load(image, segmentId);
        },
        init: function () {
            this.show = 1.0;
            let groundTextureCanvas = document.createElement("canvas");
            groundTextureCanvas.width = 32 * 24; // 24 tiles across, 32 pixels each
            groundTextureCanvas.height = 32 * 24; // 24 tiles across, 32 pixels each
            this.groundTextureCtx = groundTextureCanvas.getContext("2d");

            let sceneryCanvas = document.createElement("canvas");
            sceneryCanvas.width = groundTextureCanvas.width;
            sceneryCanvas.height = groundTextureCanvas.height;
            this.sceneryCtx = sceneryCanvas.getContext("2d");
        },
        loadSceneryInstances: function() {   
            this.sceneryInstances = new Map();
            for (const [sceneryId, tileIdList] of this.sceneryInstancesBySceneryId.entries()) {
                let scenery = Game.sceneryMap.get(Number(sceneryId));
                for (let i = 0; i < tileIdList.length; ++i) {
                    let xy = tileIdToXY(tileIdList[i]);

                    let spriteFrame = Game.SpriteManager.getSpriteFrameById(scenery.spriteFrameId);
                    let mapKey = xy.y + spriteFrame.frames[0].height - (spriteFrame.anchor.y * spriteFrame.frames[0].height);
                    if (!this.sceneryInstances.has(mapKey))
                        this.sceneryInstances.set(mapKey, []);

                    this.sceneryInstances.get(mapKey).push({
                        id: scenery.id,
                        name: scenery.name,
                        x: xy.x, 
                        y: xy.y,
                        tileId: tileIdList[i], 
                        leftclickOption: scenery.leftclickOption,
                        sprite: [new Game.SpriteFrame(spriteFrame.frameData)],
                        type: "scenery",
                        attributes: scenery.attributes
                    });
                }
            }
        },
        addSceneryToCanvas: function(instances) {
            console.log("adding to canvas")
            this.sceneryCtx.clearRect(0, 0, this.sceneryCtx.canvas.width, this.sceneryCtx.canvas.height);

            let playerTileId = xyToTileId(~~Game.currentPlayer.destPos.x, ~~Game.currentPlayer.destPos.y);
            let localOriginTileX = (playerTileId % 25000) - 12; // cos 24x24 tiles
            let localOriginTileY = ~~(playerTileId / 25000) - 12; // cos 24x24 tiles
            for (const [sceneryId, tileIds] of instances.entries()) {
                let scenery = Game.sceneryMap.get(Number(sceneryId));
                let spriteFrame = Game.SpriteManager.getSpriteFrameById(scenery.spriteFrameId);
                for (let i = 0; i < tileIds.length; ++i) {
                    // get the tileId local to the player (i.e. tileId 0 being the top-left corner, knowing the canvas is 24x24 tiles)
                    let tileX = tileIds[i] % 25000;
                    let tileY = ~~(tileIds[i] / 25000);
                    let localTileId = (tileX - localOriginTileX) + ((tileY - localOriginTileY) * 25000);
                    let xy = tileIdToXY(localTileId);
                    spriteFrame.draw(this.sceneryCtx, xy.x, xy.y);
                }
            }
        },
        loadTextureMaps: function() {
            this.groundTexturesMap = new Map();
            let groundTextures = Game.SpriteManager.groundTextures;
            
            let spriteMaps = new Map();
            for (let i = 0; i < groundTextures.length; ++i) {
                if (!spriteMaps.has(groundTextures[i].spriteMapId))
                    spriteMaps.set(groundTextures[i].spriteMapId, Game.SpriteManager.getSpriteMapById(groundTextures[i].spriteMapId));
            }

            let that = this;
            spriteMaps.forEach(function(spriteMap, spriteMapId, map) {
                let imgCanvas = document.createElement("canvas");
                let imgCtx = imgCanvas.getContext("2d");
                imgCanvas.width = spriteMap.width;
                imgCanvas.height = spriteMap.height;
                imgCtx.width = spriteMap.width;
                imgCtx.height = spriteMap.height;
                imgCtx.drawImage(spriteMap, 0, 0);

                let subImgCanvas = document.createElement("canvas");
                subImgCanvas.width = 32;
                subImgCanvas.height = 32;
                subImgCtx = subImgCanvas.getContext("2d");
                subImgCtx.width = 32;
                subImgCtx.height = 32;

                let matchingGroundTextures = groundTextures.filter(e => e.spriteMapId == spriteMapId);
                for (let i = 0; i < matchingGroundTextures.length; ++i) {
                    let groundTexture = matchingGroundTextures[i];
                    let imageData = imgCtx.getImageData(groundTexture.getCurrentFrame().left, groundTexture.getCurrentFrame().top, 32, 32);
                    subImgCtx.putImageData(imageData, 0, 0);

                    let subImg = new Image();
                    subImg.onload = function() {
                        let pat = context.createPattern(this, "repeat");
                        that.groundTexturesMap.set(groundTexture.id, pat);
                    }
                    subImg.src = subImgCanvas.toDataURL("image/png");
                }
            });
        },
        loadNpcs: function(npcJson) {
            for (let i = 0; i < npcJson.length; ++i) {
                Game.npcMap.set(npcJson[i].id, {
                    id: npcJson[i].id,
                    name: npcJson[i].name,
                    upId: npcJson[i].upId,
                    downId: npcJson[i].downId,
                    leftId: npcJson[i].leftId,
                    rightId: npcJson[i].rightId,
                    attackId: npcJson[i].attackId,
                    scaleX: npcJson[i].scaleX,
                    scaleY: npcJson[i].scaleY,
                    maxHp: npcJson[i].hp,
                    cmb: npcJson[i].cmb,
                    leftclickOption: npcJson[i].leftclickOption,
                    otherOptions: npcJson[i].otherOptions
                });
            }
        },
        addPlayer: function (obj) {
            var player = new Game.Player(obj.tileId);
            player.id = obj.id;
            player.name = obj.name;

            player.currentHp = obj.currentHp;
            player.maxHp = obj.maxHp;
            player.combatLevel = obj.combatLevel;
            
            player.setAnimations(obj.baseAnimations);
            player.setEquipAnimations(obj.equipAnimations);

            this.otherPlayers.push(player);
        },
        draw: function (ctx, xview, yview) {
            if (room.currentShow === 0)
                return;

            this.t.reset();
            ctx.save();

            this.t.scale(Game.scale, Game.scale);
            ctx.setTransform.apply(ctx, this.t.m);

            // draw the ground textures
            let minx = this.player.destPos.x - this.player.combatOffsetX - xview - (12*32);
            let miny = (this.player.destPos.y - yview - (12*32));
            ctx.drawImage(this.groundTextureCtx.canvas, minx-16, miny-16);
            // ctx.drawImage(this.sceneryCtx.canvas, minx-16, miny-16);

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
                                itemId: this.groundItems[i].item.id,
                                tileId: this.groundItems[i].tileId
                            });
                        }
                    }
                }
            }

            this.drawLegacy(ctx, xview, yview);

            for (let i = 0; i < this.teleportExplosions.length; ++i) {
                let lifetime = (1 - this.teleportExplosions[i].lifetime); // 0 -> 1
                let size = Math.sin(1 - lifetime) * 64;

                ctx.globalAlpha = 1 - lifetime;
                ctx.fillStyle = `rgb(${lifetime * 255}, 255, ${(1 - lifetime) * 255}`;

                ctx.beginPath();
                ctx.arc(this.teleportExplosions[i].x - xview, 
                        this.teleportExplosions[i].y - yview, size, 0, 2 * Math.PI);
                ctx.fill();
            }

            // these draw calls still draw stuff like the death curtain, health bars, chat etc so draw these last.
            this.player.draw(ctx, xview, yview);
            for (var i in this.otherPlayers) {
                this.otherPlayers[i].draw(ctx, xview, yview);
            }

            for (var i in this.npcs) {
                this.npcs[i].draw(ctx, xview, yview);
            }
            
            var mp = Game.mousePos || { x: 0, y: 0 };
            var transformed = this.t.transformPoint(mp.x, mp.y);
            cursor.setPos({ x: transformed.x + xview, y: transformed.y + yview });
            cursor.draw(ctx, xview, yview);

            ctx.restore();
        },
        drawLegacy: function(ctx, xview, yview) {
            // add everything to the draw map so we can draw in the correct order
            var drawMap = new Map();
            
            // add the current player
            let playerSpriteFrame = this.player.getCurrentSpriteFrame();
            let mapKey = this.player.y + (playerSpriteFrame.getCurrentFrame().height * playerSpriteFrame.scale.y) - ((playerSpriteFrame.anchor.y * playerSpriteFrame.getCurrentFrame().height) * playerSpriteFrame.scale.y);
            if (!drawMap.has(mapKey))
                drawMap.set(mapKey, []);
                
            drawMap.get(mapKey).push({
                id: this.player.id,
                name: this.player.name,
                x: this.player.x, 
                y: this.player.y,
                sprite: this.player.getCurrentSpriteFrames(),
                type: "player",
                leftclickOption: 0
            });

            // add the other players
            for (var i in this.otherPlayers) {
                let currentSpriteFrame = this.otherPlayers[i].getCurrentSpriteFrames()[0];
                let mapKey = this.otherPlayers[i].y + (currentSpriteFrame.getCurrentFrame().height * currentSpriteFrame.scale.y) - ((currentSpriteFrame.anchor.y * currentSpriteFrame.getCurrentFrame().height) * currentSpriteFrame.scale.y);
                if (!drawMap.has(mapKey))
                    drawMap.set(mapKey, []);

                drawMap.get(mapKey).push({
                    id: this.otherPlayers[i].id,
                    name: this.otherPlayers[i].name + ` (lvl ${this.otherPlayers[i].combatLevel})`,
                    x: this.otherPlayers[i].x, 
                    y: this.otherPlayers[i].y - (this.otherPlayers[i].deathSequence ? ((1 - this.otherPlayers[i].deathsCurtain) * 32) : 0),
                    sprite: this.otherPlayers[i].getCurrentSpriteFrames(),
                    type: "player",
                    leftclickOption: 0,
                    transparency: this.otherPlayers[i].deathSequence ? Math.max(this.otherPlayers[i].deathsCurtain, 0.01) : 1
                });
            }

            // add the NPCs
            for (var i = 0; i < this.npcs.length; ++i) {
                let currentSpriteFrame = this.npcs[i].getCurrentSpriteFrame();
                let mapKey = this.npcs[i].pos.y + (currentSpriteFrame.getCurrentFrame().height * currentSpriteFrame.scale.y) - ((currentSpriteFrame.anchor.y * currentSpriteFrame.getCurrentFrame().height) * currentSpriteFrame.scale.y);
                if (!drawMap.has(mapKey))
                    drawMap.set(mapKey, []);

                drawMap.get(mapKey).push({
                    id: this.npcs[i].instanceId,
                    name: this.npcs[i].get("name") + (this.npcs[i].get("leftclickOption") == 4096 ? ` (lvl ${this.npcs[i].get("cmb")})` : ""),
                    x: this.npcs[i].pos.x, 
                    y: this.npcs[i].pos.y - (this.npcs[i].deathTimer * 32),
                    sprite: [this.npcs[i].getCurrentSpriteFrame()],
                    type: "npc",
                    leftclickOption: this.npcs[i].get("leftclickOption"),
                    label: this.npcs[i].getLeftclickLabel(),
                    transparency: Math.max(1 - this.npcs[i].deathTimer, 0.01)
                });
            }

            // add scenery
            this.compileDrawableSceneryMap(xview, yview);
            this.drawableSceneryMap.forEach(function(value, key, map) {
                if (!drawMap.has(key))
                    drawMap.set(key, []);
                drawMap.set(key, drawMap.get(key).concat(value));
            });

            // active spells
            for (let i = 0; i < this.spells.length; ++i) {
                if (!drawMap.has(this.spells[i].pos.y))
                    drawMap.set(this.spells[i].pos.y, []);
                drawMap.get(this.spells[i].pos.y).push({
                    x: this.spells[i].pos.x,
                    y: this.spells[i].pos.y,
                    sprite: [this.spells[i].spriteFrame]
                });
            }

            var orderedDrawMap = new Map([...drawMap.entries()].sort());// order by ypos
            orderedDrawMap.forEach(function(value, key, map) {
                for (var i = 0; i < value.length; ++i) {
                    var currentFrame = value[i].sprite[0].getCurrentFrame();

                    ctx.globalAlpha = value[i].transparency || 1;
                    for (var j = 0; j < value[i].sprite.length; ++j)
                        value[i].sprite[j].draw(ctx, value[i].x - xview, value[i].y - yview, value[i].sprite[j].color);

                    if (Game.activeUiWindow == null) {
                        var rect = new Game.Rectangle(
                            value[i].x - xview - ((currentFrame.width * value[i].sprite[0].scale.x) * value[i].sprite[0].anchor.x), 
                            value[i].y - yview - ((currentFrame.height * value[i].sprite[0].scale.y) * value[i].sprite[0].anchor.y), 
                            currentFrame.width * value[i].sprite[0].scale.x, currentFrame.height * value[i].sprite[0].scale.y);

                        // mouse position needs to account for scale because the whole context is currently scaled
                        if (rect.pointWithin({x: Game.mousePos.x / Game.scale, y: Game.mousePos.y / Game.scale}) &&
                            Game.worldCameraRect.pointWithin(Game.mousePos)) {
                            
                            if (Game.drawBoundingBoxes) {
                                ctx.strokeStyle = "red";
                                ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                            }

                            let unusable = ((value[i].attributes || 0) & 1) == 1 && value[i].type === "scenery";
                            if (Game.currentPlayer.inventory.slotInUse && value[i].name && !unusable) {
                                Game.ContextMenu.setLeftclick(Game.mousePos, {
                                    id: Game.currentPlayer.id,
                                    action: "use",
                                    src: Game.currentPlayer.inventory.slotInUse.item.id,
                                    dest: value[i].tileId,
                                    type: value[i].type,
                                    label: "use {0} -> {1}".format(Game.currentPlayer.inventory.slotInUse.item.name, value[i].name)
                                });
                            } else {
                                if (value[i].leftclickOption) {
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
        },
        process: function (dt) {
            this.currentShow += (this.show - this.currentShow) * dt;

            // we need to figure out which players/npcs/scenery moved in the past frame,
            // so that we only redraw them when necessary.  moving can mean physically changing
            // position, or having the sprite update (e.g. fires, fishing spots).

            // there are certain cases where something can either move or just change sprite while 
            // standing still (e.g. butterfly), or future idle animations for npcs/players,
            // so we will need to save the previous/current positions AND sprite frames, then filter
            // for all the things that had a modification in either of the two.
            let playerPrevPositions = new Map();
            let playerNewPositions = new Map();
            playerPrevPositions.set(this.player.id, {x: this.player.x, y: this.player.y, spriteFrame: this.player.getBaseSpriteFrame().currentFrame});
            this.player.process(dt);
            playerNewPositions.set(this.player.id, {x: this.player.x, y: this.player.y, spriteFrame: this.player.getBaseSpriteFrame().currentFrame});
            for (let i in this.otherPlayers) {
                playerPrevPositions.set(this.otherPlayers[i].id, {x: this.otherPlayers[i].x, y: this.otherPlayers[i].y, spriteFrame: this.player.getBaseSpriteFrame().currentFrame});
                this.otherPlayers[i].process(dt);
                playerPrevPositions.set(this.otherPlayers[i].id, {x: this.otherPlayers[i].x, y: this.otherPlayers[i].y, spriteFrame: this.player.getBaseSpriteFrame().currentFrame});
            }

            let changedPlayerIds = [];
            for (let [key, value] of playerPrevPositions.entries()) {
                if (!playerNewPositions[key])
                    continue;
                
                if (playerNewPositions[key].x !== value.x 
                        || playerNewPositions[key].y !== value.y 
                        || playerNewPositions.spriteFrame !== value.spriteFrame) {
                            changedPlayerIds.add(key)
                }
            }

            let npcPrevPositions = new Map();
            let npcNewPositions = new Map();
            this.npcs = this.npcs.filter(npc => npc.deathTimer < 1);
            for (let i in this.npcs) {
                npcPrevPositions.set(this.npcs[i].instanceId, {x: this.npcs[i].pos.x, y: this.npcs[i].pos.y, spriteFrame: this.npcs[i].getCurrentSpriteFrame().currentFrame});
                this.npcs[i].process(dt);
                npcNewPositions.set(this.npcs[i].instanceId, {x: this.npcs[i].pos.x, y: this.npcs[i].pos.y, spriteFrame: this.npcs[i].getCurrentSpriteFrame().currentFrame});
            }

            let changedNpcInstanceIds = [];
            for (let [key, value] of npcPrevPositions.entries()) {
                if (!npcNewPositions[key])
                    continue;

                if (npcNewPositions[key].x !== value.x 
                    || npcNewPositions[key].y !== value.y 
                    || npcNewPositions.spriteFrame !== value.spriteFrame) {
                        changedNpcInstanceIds.add(key)
                }
            }

            // scenery never moves, so we just need to record the sprite frame
            let sceneryPrevPositions = new Map();
            let sceneryNewPositions = new Map();
            this.drawableSceneryMap.forEach(function(value, key, map) {
                for (let i in value) {
                    sceneryPrevPositions.set(value[i].tileId, value[i].sprite[0].currentFrame)
                    value[i].sprite[0].process(dt);
                    sceneryNewPositions.set(value[i].tileId, value[i].sprite[0].currentFrame)
                }
            });

            let changedSceneryInstanceIds = [];
            for (let [key, value] of sceneryPrevPositions.entries()) {
                if (!sceneryNewPositions[key])
                    continue;

                if (sceneryNewPositions[key].x !== value.x 
                    || sceneryNewPositions[key].y !== value.y 
                    || sceneryNewPositions.spriteFrame !== value.spriteFrame) {
                        changedSceneryInstanceIds.add(key)
                }
            }
            
            for (let i = 0; i < this.spells.length; ++i)
                this.spells[i].process(dt);
            this.spells = this.spells.filter(spell => spell.lifetime > 0);

            for (let i = 0; i < this.teleportExplosions.length; ++i)
                this.teleportExplosions[i].lifetime -= dt;
            this.teleportExplosions = this.teleportExplosions.filter(e => e.lifetime > 0);

            Game.Minimap.setOtherPlayers(this.otherPlayers);
            Game.Minimap.setGroundItems(this.groundItems);
            Game.Minimap.setNpcs(this.npcs);
        },
        updateGroundTextures: function() {
            // we can group identical tiles and draw them once as a group with a repeating texture
            // e.g. 
            // grass=0, dirt=1
            /*
              now: 100 draw calls
              0000000000
              0000000000
              1111110000
              0000010000
              0000010000
              0000010000
              0000011100
              0000000100
              0011111100
              0010000000
            
              optimized ('-'=unprocessed grass, "="=unprocessed dirt): 13 draw calls
              0---------
              ----------
              1=====0---
              0----1----
              -----=----
              -----=----
              -----=1=0-
              -----0-1--
              0-1=====--
              --10------

              algorithm:
              We know that we've got a grid of x*y, let's say 10*10, sorted by y, x
              Starting from the top-left tile, we branch out once left, then once down.
              We keep branching out alternating left and down, until we either hit a different
                tile or we hit the last element in the row/column.
              When we hit the first different tile/last element, we just continue down the other
                direction until we hit the end of that one too.
              The final result is the square of tiles that we will group into a single draw call.
              All of the tiles in the draw call are marked as processed.
              Now repeat over and over with the first "unprocessed" tile until there's no more tiles.

            */
            let gridW = 24;
            let gridH = 24;

            let data = this.drawableTextureInstances.map(texId => ({id: texId, processed: false}));
            this.optimizedDrawableTextureInstance = new Map();

            let counter = 0;
            while (++counter < 24*24) { 
                // run through the array until we find the first unprocessed element
                let firstEle = null;
                for (let i = 0; i < data.length; ++i) {
                    if (!data[i]) {
                        continue;
                    }

                    if (!data[i].processed) {
                        firstEle = i;
                        break;
                    }
                }

                // if all the elements are processed then we're finished
                if (firstEle == null)
                    break;

                // x/y position of the element as a 2d array
                let posX = firstEle % gridW;
                let posY = ~~(firstEle / gridW);

                let x, y, len;
                let textureId = this.drawableTextureInstances[firstEle];

                outer:
                for (y = posY; y < gridH; ++y) {
                    for (x = posX; x < (len || gridW); ++x) {
                        let testNode = data[x + (y * gridW)];
                        if (!testNode || testNode.processed === true || testNode.id !== textureId) {
                            if (y === posY) {
                                len = x;
                            } else {
                                break outer;
                            }
                        }
                    }

                    if (!len)
                        len = gridW;
                }
                x = len - 1;
                --y;

                // mark all the successful nodes in the rect as processed
                for (let j = posY; j <= y; ++j) {
                    for (let i = posX; i <= x; ++i) {
                        data[i + (j * gridW)].processed = true;
                    }
                }

                let w = x - posX + 1;
                let h = y - posY + 1;

                if (!this.optimizedDrawableTextureInstance.has(textureId)) 
                    this.optimizedDrawableTextureInstance.set(textureId, []);

                this.optimizedDrawableTextureInstance.get(textureId).push({
                    x: (~~(firstEle%gridW) * 32), 
                    y: (~~(firstEle/gridW) * 32), 
                    w: w * 32, 
                    h: h * 32, 
                    textureId: textureId
                });
            }

            // save the current ground textures to a background canvas, then we can draw it in a single draw call each frame
            this.saveGroundTexturesToCanvas(this.groundTextureCtx);
        },
        saveGroundTexturesToCanvas: function(ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            // take the ground texture with the most instances and draw it first as the entire background
            let textureWithMostInstances = 0;
            let mostInstances = 0;
            for (const [key, value] of this.optimizedDrawableTextureInstance) {
                mostInstances = Math.max(mostInstances, value.length);
                if (mostInstances === value.length)
                    textureWithMostInstances = key;
            }

            if (textureWithMostInstances > 0) {
                ctx.fillStyle = this.groundTexturesMap.get(textureWithMostInstances);
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }

            for (const [key, value] of this.optimizedDrawableTextureInstance) {
                if (key === textureWithMostInstances)
                    continue;

                ctx.save();
                ctx.beginPath();
                for (let i = 0; i < value.length; ++i) {
                    ctx.rect(value[i].x, value[i].y, value[i].w, value[i].h);
                }

                ctx.fillStyle = this.groundTexturesMap.get(key);
                ctx.fill();

                ctx.restore();
            }
        },
        compileDrawableSceneryMap: function(xview, yview) {
            this.drawableSceneryMap = this.sceneryInstances;
        },
        refreshGroundItems: function(obj) {
            // {tileId: [itemId, itemId, itemId, ...]}
            // {31221: [55, 27, ...]}

            let groundItems = [];
            for (let tileId in obj) {
                for (let i = 0; i < obj[tileId].length; ++i) {
                    groundItems.push(new Game.GroundItem(tileId, obj[tileId][i]));
                }
            }
            this.groundItems = groundItems;
        }
    };
    canvas.addEventListener("mousedown", function (e) {
        if (Game.state === 'game') {

            // TODO inventory, minimap, stats etc should all be contained within this
            if (Game.HUD.mouseWithin(Game.mousePos)) {
                Game.HUD.onMouseDown(e);
            } 

            if (Game.activeUiWindow) {
                Game.activeUiWindow.onMouseDown(e);
            }
            else if (Game.getPlayer().inventory.rect.pointWithin(Game.mousePos)) {
                Game.getPlayer().inventory.onMouseDown(e.button);
            } 
            else if (Game.ContextMenu.active && e.button == 0) {// left
                // selecting a context option within the game world
                Game.ContextMenu.handleMenuSelect();
                room.player.inventory.slotInUse = null;
            }
            else if (Game.Minimap.rect.pointWithin(Game.mousePos)) {
                Game.Minimap.onMouseDown(e.button);
            } 
            else if (room.player.stats.rect.pointWithin(Game.mousePos)) {
                room.player.stats.onMouseDown(e.button);
            }
            else if (Game.worldCameraRect.pointWithin(Game.mousePos)) {
                switch (e.button) {
                    case 0: // left
                        if (!Game.ContextMenu.active && room.player.inventory.slotInUse == null) {
                            if (Game.ContextMenu.leftclickMenuOption == null) {
                                // no stored leftclick option, so just move to the position
                                cursor.handleClick(false);

                                if (Game.ctrlPressed) {
                                    let tileId = xyToTileId(~~cursor.mousePos.x, ~~cursor.mousePos.y);
                                    Game.ws.send({
                                        action: "message",
                                        id: Game.getPlayer().id,
                                        message: `::tele ${tileId}`
                                    });
                                } else {
                                    Game.ws.send({ action: "move", id: room.player.id, x: ~~cursor.mousePos.x, y: ~~cursor.mousePos.y });
                                    Game.Minimap.setPlayerDestXY(~~cursor.mousePos.x, ~~cursor.mousePos.y);
                                }
                            } else {
                                // there's a stored leftclick option so perform the leftclick option
                                cursor.handleClick(true);
                                Game.ws.send(Game.ContextMenu.leftclickMenuOption);
                            }
                        } else if (room.player.inventory.slotInUse != null) {
                            // are we hovering over a player/scenery/npc?
                            let handled = false;
                            room.drawableSceneryMap.forEach(function(value, key, map) {
                                for (var i in value) {
                                    var sprite = value[i].sprite[0];
                                    var spriteFrame = sprite.getCurrentFrame();
                                    var rect = new Game.Rectangle(
                                        value[i].x - (spriteFrame.width * sprite.anchor.x), 
                                        key - (spriteFrame.height * sprite.anchor.y), 
                                        spriteFrame.width, 
                                        spriteFrame.height);
    
                                    let unusable = (value[i].attributes & 1) == 1;
                                    if (rect.pointWithin(cursor.mousePos) && !unusable) {// don't use with walls, fences etc
                                        cursor.handleClick(true);
                                        var tileId = value[i].tileId;
                                        Game.ws.send({
                                            action: "use",
                                            id: room.player.id,
                                            src: room.player.inventory.slotInUse.item.id,
                                            dest: tileId,
                                            type: "scenery",
                                            slot: room.player.inventory.slotInUse.id
                                        });
                                        room.player.inventory.slotInUse = null;
                                        handled = true;
                                        return;
                                    }
                                }
                            });

                            // npc
                            if (!handled) {
                                for (let i = 0; i < room.npcs.length; ++i) {
                                    var sprite = room.npcs[i].getCurrentSpriteFrame();
                                    var spriteFrame = sprite.getCurrentFrame();
                                    let rect = new Game.Rectangle(
                                        room.npcs[i].pos.x - ((spriteFrame.width * sprite.scale.x) * sprite.anchor.x), 
                                        room.npcs[i].pos.y - ((spriteFrame.height * sprite.scale.y) * sprite.anchor.y), 
                                        (spriteFrame.width * sprite.scale.x), 
                                        (spriteFrame.height * sprite.scale.y));

                                    if (rect.pointWithin(cursor.mousePos)) {
                                        cursor.handleClick(true);
                                        Game.ws.send({
                                            action: "use",
                                            type: "npc",
                                            id: room.player.id,
                                            src: room.player.inventory.slotInUse.item.id,
                                            slot: room.player.inventory.slotInUse.id,
                                            dest: room.npcs[i].instanceId
                                        });
                                        room.player.inventory.slotInUse = null;
                                        handled = true;
                                        return;
                                    }
                                }
                            }

                            if (!handled) {
                                for (let i = 0; i < room.otherPlayers.length; ++i) {
                                    let player = room.otherPlayers[i];
                                    var spriteFrame = player.getCurrentSpriteFrame();
                                        var rect = new Game.Rectangle(
                                            player.x - (spriteFrame.getCurrentFrame().width * spriteFrame.anchor.x), 
                                            player.y - (spriteFrame.getCurrentFrame().height * spriteFrame.anchor.y), 
                                            spriteFrame.getCurrentFrame().width, 
                                            spriteFrame.getCurrentFrame().height);
        
                                    if (rect.pointWithin(cursor.mousePos)) {
                                        cursor.handleClick(true);
                                        Game.ws.send({
                                            action: "use",
                                            type: "player",
                                            id: room.player.id,
                                            src: room.player.inventory.slotInUse.item.id,
                                            slot: room.player.inventory.slotInUse.id,
                                            dest: player.id
                                        });
                                        room.player.inventory.slotInUse = null;
                                        handled = true;
                                        return;
                                    }
                                }
                            }

                            if (!handled) {
                                var spriteFrame = room.player.getCurrentSpriteFrame();
                                    var rect = new Game.Rectangle(
                                        room.player.x - (spriteFrame.getCurrentFrame().width * spriteFrame.anchor.x), 
                                        room.player.y - (spriteFrame.getCurrentFrame().height * spriteFrame.anchor.y), 
                                        spriteFrame.getCurrentFrame().width, 
                                        spriteFrame.getCurrentFrame().height);

                                if (rect.pointWithin(cursor.mousePos)) {
                                    cursor.handleClick(true);
                                    Game.ws.send({
                                        action: "use",
                                        type: "player",
                                        id: room.player.id,
                                        src: room.player.inventory.slotInUse.item.id,
                                        slot: room.player.inventory.slotInUse.id,
                                        dest: room.player.id
                                    });
                                    room.player.inventory.slotInUse = null;
                                    handled = true;
                                    return;
                                }
                            }
                            
                            room.player.inventory.slotInUse = null;
                        }

                        break;
                    case 2: // right
                        // take all the things that are at this position and add them to the context menu
                        if (Game.ContextMenu.active)
                            break;
                        // only check for the other players and ground items if the click was within the world rect
                        for (var i in room.otherPlayers) {
                            let p = room.otherPlayers[i];
                            if (p.clickBox.pointWithin(cursor.mousePos)) {
                                if (room.player.inventory.slotInUse) {
                                    Game.ContextMenu.push([{
                                        id: room.player.id,
                                        action: "use",
                                        src: room.player.inventory.slotInUse.item.id,
                                        dest: p.id,
                                        type: "player",
                                        label: "use {0} -> {1} (lvl {2})".format(room.player.inventory.slotInUse.item.name, p.name, p.combatLevel)
                                    }]);
                                } else {
                                    Game.ContextMenu.push(p.contextMenuOptions());
                                }
                            }
                        }
                        for (var i in room.groundItems) {
                            var groundItem = room.groundItems[i];
                            if (groundItem.clickBox.pointWithin(cursor.mousePos)) {
                                Game.ContextMenu.push([
                                    { action: "take", objectName: groundItem.item.name, itemId: groundItem.item.id, tileId: groundItem.tileId },
                                    { action: "examine", objectName: groundItem.item.name, objectId: groundItem.item.id, type: "item", source: "ground" }
                                ]);
                            }
                        }
                        room.drawableSceneryMap.forEach(function(value, key, map) {
                            for (var i in value) {
                                var sprite = value[i].sprite[0];
                                var spriteFrame = sprite.getCurrentFrame();
                                var rect = new Game.Rectangle(
                                    value[i].x - (spriteFrame.width * sprite.anchor.x), 
                                    key - (spriteFrame.height * sprite.anchor.y), 
                                    spriteFrame.width, 
                                    spriteFrame.height);

                                if (rect.pointWithin(cursor.mousePos)) {
                                    var tileId = value[i].tileId;
                                    var scenery = Game.sceneryMap.get(value[i].id);
                                    
                                    let unusable = ((value[i].attributes || 0) & 1) == 1;
                                    if (room.player.inventory.slotInUse && scenery.name && !unusable) {
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
                                    npc.pos.x - ((spriteFrame.getCurrentFrame().width * spriteFrame.scale.x) * spriteFrame.anchor.x), 
                                    npc.pos.y - ((spriteFrame.getCurrentFrame().height * spriteFrame.scale.y) * spriteFrame.anchor.y), 
                                    (spriteFrame.getCurrentFrame().width * spriteFrame.scale.x), 
                                    (spriteFrame.getCurrentFrame().height * spriteFrame.scale.y));

                            if (rect.pointWithin(cursor.mousePos)) {
                                if (room.player.inventory.slotInUse) {
                                    Game.ContextMenu.push([{
                                        id: room.player.id,
                                        action: "use",
                                        src: room.player.inventory.slotInUse.item.id,
                                        dest: npc.instanceId,
                                        type: "npc",
                                        label: "use {0} -> {1}".format(room.player.inventory.slotInUse.item.name, npc.get("name"))
                                                    + (npc.get("leftclickOption") === 4096 ? ` (lvl ${npc.get("cmb")})` : "")
                                    }]);
                                } else {
                                    if (npc.get("leftclickOption") != 0) {
                                        Game.ContextMenu.push([{
                                            action: Game.ContextMenu.getContextOptionById(npc.get("leftclickOption")).name,
                                            objectId: npc.instanceId,
                                            objectName: npc.get("name"),
                                            type: "npc",
                                            label: npc.getLeftclickLabel()
                                        }]);
                                    }

                                    for (var j = 0; j < Game.ContextMenu.contextOptions.length; ++j) {
                                        var contextOption = Game.ContextMenu.contextOptions[j];
                                        if (npc.get("otherOptions") & contextOption.id) {
                                            Game.ContextMenu.push([{
                                                action: contextOption.name, 
                                                objectId: npc.instanceId, 
                                                objectName: npc.get("name"), 
                                                type: "npc"
                                            }]);
                                        }
                                    }
                                }
                            }
                        }

                        var spriteFrame = room.player.getCurrentSpriteFrame();
                            var rect = new Game.Rectangle(
                                room.player.x - (spriteFrame.getCurrentFrame().width * spriteFrame.anchor.x), 
                                room.player.y - (spriteFrame.getCurrentFrame().height * spriteFrame.anchor.y), 
                                spriteFrame.getCurrentFrame().width, 
                                spriteFrame.getCurrentFrame().height);

                        if (rect.pointWithin(cursor.mousePos)) {
                            if (room.player.inventory.slotInUse) {
                                Game.ContextMenu.push([{
                                    id: room.player.id,
                                    action: "use",
                                    src: room.player.inventory.slotInUse.item.id,
                                    dest: room.player.id,
                                    type: "player",
                                    label: "use {0} -> {1} (lvl {2})".format(room.player.inventory.slotInUse.item.name, room.player.name, room.player.combatLevel)
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
    var camera = new Game.Camera(room.player.x, room.player.y, canvas.width - 250, canvas.height);
    Game.cam = camera;
    Game.worldCameraRect = new Game.Rectangle(0, 0, canvas.width - 250, canvas.height);
    var hudcamera = new Game.Camera(camera.viewportRect.width, 0, canvas.width - camera.viewportRect.width, canvas.height);
    Game.hudCameraRect = new Game.Rectangle(camera.viewportRect.width, 0, canvas.width - camera.viewportRect.width, canvas.height);
    Game.HUD = new Game.HeadsUpDisplay(Game.hudCameraRect);
    Game.hudcam = hudcamera;

    Game.Minimap.setRect(hudcamera.viewportRect.left + 10, hudcamera.viewportRect.top + 10, 230, 230);
    var cursor = new Game.Cursor((hudcamera.xView + hudcamera.wView) - 10, hudcamera.yView + 20);
    Game.cursor = cursor;

    var uiWidth = (canvas.width - 250) / 2;
    var uiHeight = canvas.height / 2;
    var uix = ~~(uiWidth - (uiWidth / 2)) + 0.5;
    var uiy = ~~(uiHeight - (uiHeight / 2)) + 0.5;
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
        Game.context.canvas.width = Game.context.canvas.width;
        Game.context.clearRect(0, 0, Game.context.canvas.width, Game.context.canvas.height);
        Game.context.beginPath();

        if (Game.state === 'game' || Game.state === 'uiwindow') {
            
            // redraw all room objects
            Game.context.fillStyle = "#000";
            Game.context.fillRect(0, 0, Game.cam.viewportRect.width * Game.scale, Game.cam.viewportRect.height * Game.scale);
            room.draw(Game.context, Game.cam.xView, Game.cam.yView);
            // redraw all hud objects
            Game.context.fillStyle = Game.hudcam.pat || "black";
            Game.context.fillRect(Game.hudcam.xView, Game.hudcam.yView, Game.hudcam.viewportRect.width, Game.hudcam.viewportRect.height);
            Game.Minimap.draw(Game.context, Game.cam.xView, Game.cam.yView);
            room.player.inventory.draw(Game.context, Game.hudcam.xView, Game.hudcam.yView + Game.Minimap.height + 20);
            room.player.stats.draw(Game.context, Game.hudcam.xView, room.player.stats.rect.top);
            Game.HUD.draw(Game.context);
            
            if (room.currentShow <= 0.98) {
                // fade out the logon screen background
                Game.context.save();
                Game.context.globalAlpha = 1 - room.currentShow;
                Game.context.drawImage(Game.LogonScreen.bkg, 0, 0, Game.LogonScreen.bkg.width, Game.LogonScreen.bkg.height);
                Game.context.restore();
            }
            Game.ChatBox.draw(Game.context, 0, Game.context.canvas.height);

            if (Game.activeUiWindow)
                Game.activeUiWindow.draw(Game.context);
            
            Game.ContextMenu.draw(Game.context);
        }
        else if (Game.state === 'logonscreen') {
            Game.LogonScreen.draw(Game.context, Game.context.canvas.width, Game.context.canvas.height);
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
    var start = Date.now();
    var remainingInterval = INTERVAL;
    Game.play = function () {        
        setTimeout(function() {
        	// TODO game loop should return exec ms to subtract off INTERVAL
        	gameLoop();

        	var actual = Date.now() - start;
	        // subtract any extra ms from the delay for the next cycle
	        remainingInterval = INTERVAL - (actual - INTERVAL);
	        start = Date.now();

        	Game.play();
        }, remainingInterval);
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
                            break;

                        case "::cursor": {
                            Game.cursor.drawCursor = !Game.cursor.drawCursor;
                            break;
                        }

                        case "::groundTextureOutline": {
                            Game.drawGroundTextureOutline = !Game.drawGroundTextureOutline;
                            break;
                        }

                        case "::bank": {
                            Game.ws.send({
                                action: "bank",
                                id: Game.getPlayer().id
                            });
                            break;
                        }

                        default: {
                            console.log("sending message: ", Game.ChatBox.userMessage);
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

    Game.getPlayer().inventory.onResize(Game.hudcam.viewportRect.left);
    Game.getPlayer().stats.onResize(Game.hudcam.viewportRect.left);
    Game.HUD.onResize(Game.hudcam.viewportRect.left);

    if (Game.activeUiWindow)
        Game.activeUiWindow.onResize(Game.worldCameraRect);
}, true);
// -->