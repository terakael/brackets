$(function(){
     // prepare our game canvas
    var canvas = document.getElementById("game"),
        context = canvas.getContext("2d"),
        matrix = [1,0,0,1,0,0];
    
    
    var ip = "localhost"
        port = "45555";
    Game.ws = new Game.WebSocket("ws://{0}:{1}/ws/game".format(ip, port), function(obj) {
        if (obj["action"] === "logon") {
			if (obj["success"] === 0) {
				Game.LogonScreen.logonErrorTimer = 10;
				Game.LogonScreen.logonError = obj["responseText"];
				return;
			}

            Game.SpriteManager.setSpriteMap(1, obj["spriteMaps"][0].name, obj["spriteMaps"][0].dataBase64);
            Game.SpriteManager.loadSpriteFrames(obj["spriteFrames"]);
            Game.SpriteManager.loadItems(obj["items"]);

            document.title = obj["name"];
			room.player = new Game.Player(obj["x"], obj["y"]);
            room.player.loadStats(obj["stats"]);
            room.player.loadInventory(obj["inventory"]);
            room.player.currentHp = obj["currentHp"];
            room.player.stats.currentHp = room.player.currentHp;
            room.player.maxHp = obj["maxHp"];
            room.player.id = obj["id"];
            room.player.name = obj["name"];
			camera.follow(room.player, (canvas.width-250-(room.player.width/2))/2, (canvas.height)/2);
			camera.xView = obj["x"] - camera.xDeadZone;
			camera.yView = obj["y"] - camera.yDeadZone;
			
			for (var i in obj["players"]) {
				room.addPlayer(obj["players"][i]);
			}
			
			// starts the fade-in
			room.show = 1.0;
            
            Game.ChatBox.add("Welcome to the game, {0}.".format(obj["name"]));
			Game.state = 'game';
        } else if (obj["action"] === "logoff") {
        	// clean up and change state to logon screen
        	room.otherPlayers = [];
        	Game.state = 'logonscreen';
        } else if (obj["action"] === "move") {
			if (obj["id"] == room.player.id) {
				room.player.destPos.x = obj["x"];
				room.player.destPos.y = obj["y"];
			} else {
				for (var i in room.otherPlayers) {
					if (obj["id"] == room.otherPlayers[i].id) {
						room.otherPlayers[i].destPos.x = obj["x"];
						room.otherPlayers[i].destPos.y = obj["y"];
						console.log("{0} new pos = ({1},{2})".format(i, room.otherPlayers[i].destPos.x, room.otherPlayers[i].destPos.y));
					}
				}
			}
		} else if (obj["action"] === "message") {
			if (obj["message"]) {
				Game.ChatBox.add("{0}: {1}".format(obj["name"], obj["message"]), obj["colour"] == null ? 'yellow' : obj["colour"]);

                if (obj["id"] == room.player.id) {
                    room.player.setChatMessage(obj["message"]);
                } else {
                    for (var i in room.otherPlayers) {
                        if (obj["id"] == room.otherPlayers[i].id) {
                            room.otherPlayers[i].setChatMessage(obj["message"]);
                        }
                    }
                }
            }
		} else if (obj["action"] === "playerEnter") {
			var p = obj["player"];
			room.addPlayer(p);
			Game.ChatBox.add(p["name"] + " has logged in.", "#0ff");
		} else if (obj["action"] === "playerLeave") {
            room.removePlayer(obj["id"]);// TODO should be session id; this is dangerous
            Game.ChatBox.add(obj["name"] + " has logged out.", "#0ff");
		} else if (obj["action"] === "addexp") {
            if (obj["id"] == room.player.id) {
                room.player.stats.gainExp(obj["statShortName"], obj["exp"]);
                if (obj["statShortName"] === "hp") {
                    room.player.maxHp = room.player.stats.exp2lvl(obj["exp"]);
                }
            }
        } else if (obj["action"] === "unknown") {
            Game.ChatBox.add("invalid action.", "#fff");
        } else if (obj["action"] === "duel" || obj["action"] === "trade") {
            if (obj["accepted"] === 0) {
                Game.ChatBox.add("{0} wishes to {1} with you.".format(obj["opponentName"], obj["action"]), "#f0f");
            } else {
                Game.ChatBox.add("{0} accepted the {1}.".format(obj["opponentName"], obj["action"]), "#f0f");
            }
        } else if (obj["action"] === "damage") {
            if (obj["id"] == room.player.id) {
                room.player.damage(obj["damage"]);
            } else {
                for (var i in room.otherPlayers) {
                    if (obj["id"] == room.otherPlayers[i].id) {
                        room.otherPlayers[i].damage(obj["damage"]);
                        break;
                    }
                }
            }
        } else if (obj["action"] === "dead") {
            if (obj["id"] == room.player.id) {
                // you died lmfao
                room.player.respawn(obj["x"], obj["y"], obj["currentHp"]);
                room.player.setDeathSequence();
            } else {
                for (var i in room.otherPlayers) {
                    if (obj["id"] == room.otherPlayers[i].id) {
                        // they died
                        room.otherPlayers[i].respawn(obj["x"], obj["y"], obj["currentHp"]);
                        room.otherPlayers[i].x = obj["x"];
                        room.otherPlayers[i].y = obj["y"];
                        room.otherPlayers[i].destPos.x = obj["x"];
                        room.otherPlayers[i].destPos.y = obj["y"];
                        break;
                    }
                }
            }
        }
    });
    
    Game.mousePos = {x: 0, y: 0};
    Game.isometric = 0;
    Game.boundingRect = canvas.getBoundingClientRect();
	Game.state = 'logonscreen';
    Game.scale = 1.5;
    Game.targetScale = 1.5

    // game settings:	
    var FPS = 50,
        INTERVAL = 1000/FPS, // milliseconds
        STEP = INTERVAL/1000; // seconds
    
    // setup an object that represents the room
    var room = {
        offset: Game.viewScale,
        width: 2000,
        height: 2000,
        map: new Game.Map(2048, 2048, canvas.width-250, canvas.height),
        player: {},
		show: 0,
		currentShow: 0,
		otherPlayers: [],
        walls: [
            new Game.Wall(1024, 987),
            new Game.Wall(1024-48, 987),
            new Game.Wall(1000, 1000)
        ],
        t: new Game.Transform(),// view matrix
        addPlayer: function(obj) {
        	if (obj["id"] !== this.player.id) {
        		var player = new Game.Player(obj["x"], obj["y"]); 
                player.currentHp = obj["currentHp"];
                player.maxHp = obj["maxHp"];
        		player.id = obj["id"];
                player.name = obj["name"];
        		//player.image = playerspritemap;
				this.otherPlayers.push(player);
			}
        },
        draw: function(ctx, xview, yview) {
			if (room.currentShow === 0)
				return;
			
            this.t.reset();
            if (Game.isometric) {
                ctx.save();
                this.t.translate(this.player.x - xview, this.player.y - yview);
                this.t.scale(1, 1/this.offset);
                this.t.rotate(45 * Math.PI / 180);
                this.t.translate(-(this.player.x - xview), -(this.player.y - yview));
                ctx.setTransform.apply(ctx, this.t.m);
            }

            ctx.save();
            this.t.scale(Game.scale, Game.scale);
            ctx.setTransform.apply(ctx, this.t.m);
            
            this.map.draw(ctx, xview, yview);
            
            var mp = Game.mousePos || {x: 0, y: 0};
            var transformed = this.t.transformPoint(mp.x, mp.y);
            cursor.setPos({x: transformed.x + xview, y: transformed.y + yview});
            
            if (!Game.ContextMenu.active && Game.worldCameraRect.pointWithin(Game.mousePos))
                cursor.draw(ctx, xview, yview);

            for (var i = 0; i < this.walls.length; ++i) {
                this.walls[i].draw(ctx, xview, yview);
            }

            context.fillStyle = "#f00";
			for (var i in this.otherPlayers) {
				this.otherPlayers[i].draw(ctx, xview, yview);
			}
            
            if (Game.isometric)
                ctx.restore();
            
            for (var i = 0; i < this.walls.length; ++i) {
                this.walls[i].draw(ctx, xview, yview);
            }

            this.player.draw(ctx, xview, yview);
            ctx.restore();
        },
        process: function(dt) {
			this.currentShow += (this.show - this.currentShow) * dt;
            this.player.process(dt, this.width, this.height);

            for (var i in this.otherPlayers) {
            	this.otherPlayers[i].process(dt, this.width, this.height);
            }


            if (this.offset < Game.viewScale) {
                this.offset += dt;
                if (this.offset > Game.viewScale)
                    this.offset = Game.viewScale;
            } else if (this.offset > Game.viewScale) {
                this.offset -= dt;
                if (this.offset < Game.viewScale)
                    this.offset = Game.viewScale;
            }
        },
        removePlayer: function(id) {
            for (var i in this.otherPlayers) {
                if (this.otherPlayers[i].id == id) {
                    this.otherPlayers.splice(i, 1);
                    return;
                }
            }
        }
    };
    
    canvas.addEventListener("mousedown", function(e) {
        if (Game.state === 'game') {
            if (Game.getPlayer().inventory.rect.pointWithin(Game.mousePos))
                Game.getPlayer().inventory.onMouseDown(e.button);
            
            switch (e.button) {
                case 0:// left
                    if (Game.ContextMenu.active) {
                        // send action based on context menu selection
                        var menuItem = Game.ContextMenu.getSelectedAction();
                        if (menuItem.action === "examine") {
                        	Game.ChatBox.add(Game.SpriteManager.getItemById(menuItem.objectId).description);
                        } else if (menuItem.action === "cancel") {

                        } else {
                            Game.ws.send(menuItem);
                        }
                        Game.ContextMenu.hide();
                    } else {
                        if (Game.worldCameraRect.pointWithin(Game.mousePos))
                            Game.ws.send({action: "move", id: room.player.id, x: ~~cursor.mousePos.x, y: ~~cursor.mousePos.y});
                    }
                    break;
                case 2:// right
                    // take all the things that are at this position and add them to the context menu
                    if (Game.ContextMenu.active)
                        break;

                    for (var i in room.otherPlayers) {
                        var p = room.otherPlayers[i];
                        if (p.clickBox.pointWithin(cursor.mousePos)) {
                            Game.ContextMenu.push(room.otherPlayers[i].contextMenuOptions());
                        }
                    }
                    Game.ContextMenu.show(~~cursor.mousePos.x, ~~cursor.mousePos.y, ~~camera.xView, ~~camera.yView);
                    break;
            }
        }
    }, false);

    canvas.addEventListener("mouseup", function(e) {
        if (Game.state === 'game') {
            switch (e.button) {
                case 0:
                    if (Game.ContextMenu.active) {

                    } else {
                        //if (Game.getPlayer().inventory.rect.pointWithin(Game.mousePos))
                        Game.getPlayer().inventory.onMouseUp(e.button);
                    }
                    break;
            }
        }
    }, false);

    canvas.addEventListener("mousewheel", function(e) {
        if (Game.worldCameraRect.pointWithin(Game.mousePos)) {
            var e = window.event || e; // old IE support
            Game.targetScale += Math.max(-0.1, Math.min(0.1, (e.wheelDelta || -e.detail)));
            if (Game.targetScale < 1)
                Game.targetScale = 1;
            else if (Game.targetScale > 2)
                Game.targetScale = 2;
        }
    }, false);
	
    // generate a large image texture for the room
    var grass = new Image();
    grass.src = "img/grass.jpg";
    grass.onload = function() {
        room.map.generate(grass);
    }
    
    var stone = new Image();
    stone.src = "img/stone.jpg";
    stone.onload = function() {
        hudcamera.pat = context.createPattern(stone, "repeat");
    }

    var playerspritemap = new Image();
    playerspritemap.src = "img/kanakospritemap.png";
    playerspritemap.onload = function() {
        Game.Player.prototype.image = playerspritemap;
        Game.Wall.prototype.image = playerspritemap;
    }

    // setup the magic camera !!!
    var camera = new Game.Camera(room.player.x, room.player.y, canvas.width-250, canvas.height, room.width, room.height);
    Game.worldCameraRect = new Game.Rectangle(0, 0, canvas.width-250, canvas.height);
    
    var hudcamera = new Game.Camera(camera.viewportRect.width, 0, canvas.width - camera.viewportRect.width, canvas.height);
    Game.hudCameraRect = new Game.Rectangle(camera.viewportRect.width, 0, canvas.width - camera.viewportRect.width, canvas.height);
    
    var cursor = new Game.Cursor((hudcamera.xView + hudcamera.wView) - 10, hudcamera.yView + 20);
    
    var grid = new Game.Grid();
    grid.createGridLines(camera.viewportRect.width, camera.viewportRect.height);
    
    // Game update function
    var update = function() {
		if (Game.state === 'game') {
            Game.scale += (Game.targetScale - Game.scale) * STEP * 10;

			room.process(STEP);
			camera.update(STEP);
			Game.ChatBox.process(STEP);
            Game.ContextMenu.process(STEP);
		} else if (Game.state === 'logonscreen') {
			Game.LogonScreen.process(STEP);
		}
    }
    var counter = 0;
    // Game draw function
    var draw = function() {    
		if (Game.state === 'game') {
			// redraw all room objects
			context.fillStyle = "#000";
			//context.clearRect(0, 0, camera.viewportRect.width, camera.viewportRect.height);
			context.fillRect(0, 0, camera.viewportRect.width, camera.viewportRect.height);
			room.draw(context, camera.xView, camera.yView);
			
			// redraw all hud objects
			context.fillStyle = hudcamera.pat || "black";
			context.fillRect(hudcamera.xView, hudcamera.yView, hudcamera.viewportRect.width, hudcamera.viewportRect.height);
			
			Game.Minimap.draw(context, hudcamera.xView, 0);
			room.player.inventory.draw(context, hudcamera.xView, hudcamera.yView + Game.Minimap.height + 20);
			room.player.stats.draw(context, hudcamera.xView, hudcamera.viewportRect.height - ((room.player.stats.stats.length + 2) * room.player.stats.y));
			
            
            if (room.currentShow <= 0.98) {
                context.fillStyle = "rgba(0, 0, 0, "+(1-room.currentShow)+")";
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
			Game.ChatBox.draw(context, 0, canvas.height);
            Game.ContextMenu.draw(context);
		} else if (Game.state === 'logonscreen') {
			Game.LogonScreen.draw(context, canvas.width, canvas.height);
		}
    }

    // Game Loop
    var gameLoop = function(){        				
        update();
        draw();
    }

    // I'll use setInterval instead of requestAnimationFrame for compatibility reason,
    // but it's easy to change that.

    var runningId = -1;

    Game.play = function(){	
        if(runningId === -1){
            runningId = setInterval(function(){
                gameLoop();
            }, INTERVAL);
            console.log("play");
        }
    };

    Game.togglePause = function(){		
        if(runningId === -1){
            Game.play();
        }
        else
        {
            clearInterval(runningId);
            runningId = -1;
            console.log("paused");
        }
    };
	
	Game.getPlayer = function() {
		return room.player;
	}

    // -->

});

Game.getMousePos = function(e) {
    return {x: e.clientX - Game.boundingRect.left, y: e.clientY - Game.boundingRect.top};
}
window.addEventListener("mousemove", function(e) {
    Game.mousePos = Game.getMousePos(e);
});
window.addEventListener("keypress", function(e) {
	var inp = String.fromCharCode(event.keyCode);
	if (Game.state === 'game') {
		if (/[a-zA-Z0-9 @#$-/:-?{-~!"^_`\[\]]/.test(inp)) {
			if (Game.ChatBox.userMessage.length < 100)
				Game.ChatBox.userMessage += inp;
			return;
		}
	} else if (Game.state === 'logonscreen') {
		Game.LogonScreen.onKeyPress(inp);
	}
});
window.addEventListener("keydown", function(e) {
    var event = window.event ? window.event : e;
	if (Game.state === 'logonscreen') {
		Game.LogonScreen.onKeyDown(event.keyCode);
		return;
	} else if (Game.state === 'game') {
		switch (event.keyCode) {
			case 38:// up
				Game.targetScale += 0.1;
                if (Game.targetScale > 2)
                    Game.targetScale = 2;
				break;
			case 40:// down
				Game.targetScale -= 0.1;
				if (Game.targetScale < 1)
                    Game.targetScale = 1;
				break;
			case 13://enter
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
			case 8:// backspace
				if (Game.ChatBox.userMessage.length > 0)
					Game.ChatBox.userMessage = Game.ChatBox.userMessage.substring(0, Game.ChatBox.userMessage.length - 1);
				break;
		}
	}
});

// -->
// start the game when page is loaded
window.onload = function() {	
    Game.play();
}