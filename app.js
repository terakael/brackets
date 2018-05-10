$(function(){
     // prepare our game canvas
    var canvas = document.getElementById("game"),
        context = canvas.getContext("2d"),
        matrix = [1,0,0,1,0,0];
    
    
    var ip = "localhost"
        port = "45555";
    Game.ws = new Game.WebSocket("ws://{0}:{1}/ws/game".format(ip, port), function(obj) {
        if (obj["action"] === "logon") {
			Game.logonstate = 'username';
			Game.username = '';
			Game.password = '';
			if (obj["success"] === 0) {
				Game.logonErrorTimer = 10;
				Game.logonError = obj["responseText"];
				return;
			}

			room.player = new Game.Player(obj["x"], obj["y"]);
            room.player.loadStats(obj["stats"]);
            room.player.id = obj["userId"];
			camera.follow(room.player, (canvas.width-250-(room.player.width/2))/2, (canvas.height)/2);
			camera.xView = obj["x"] - camera.xDeadZone;
			camera.yView = obj["y"] - camera.yDeadZone;
			
			for (var i in obj["players"]) {
				room.addPlayer(obj["players"][i]);
			}
			
			room.show = 1.0;
            
            Game.ChatBox.add("welcome to the game, {0}.".format(obj["username"]));
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
			if (obj["message"])
				Game.ChatBox.add(obj["message"], obj["colour"] == null ? 'yellow' : obj["colour"]);
		} else if (obj["action"] === "playerEnter") {
			var p = obj["player"];
			room.addPlayer(p);
			Game.ChatBox.add(p["name"] + " has logged in.", "#0ff");
		} else if (obj["action"] === "playerLeave") {

		}
    });
    
    Game.isometric = 0;
    Game.boundingRect = canvas.getBoundingClientRect();
	Game.state = 'logonscreen';

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
        		player.id = obj["id"];
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
            
            this.map.draw(ctx, xview, yview);
            
            var mp = Game.mousePos || {x: 0, y: 0};
            var transformed = this.t.transformPoint(mp.x, mp.y);
            cursor.setPos({x: transformed.x + xview, y: transformed.y + yview});
            
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
            
            this.player.draw(ctx, xview, yview);
            for (var i = 0; i < this.walls.length; ++i) {
                this.walls[i].draw(ctx, xview, yview);
            }
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
        }
    };
    
    canvas.addEventListener("mousedown", function(e) {
        //room.player.setDestPos(cursor.mousePos);
        Game.ws.send({action: "move", id: room.player.id, x: ~~cursor.mousePos.x, y: ~~cursor.mousePos.y});
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
    
    var hudcamera = new Game.Camera(camera.viewportRect.width, 0, canvas.width - camera.viewportRect.width, canvas.height);
    
    var cursor = new Game.Cursor((hudcamera.xView + hudcamera.wView) - 10, hudcamera.yView + 20);
    
    var grid = new Game.Grid();
    grid.createGridLines(camera.viewportRect.width, camera.viewportRect.height);
    
    // Game update function
    var update = function() {
		if (Game.state === 'game') {
			room.process(STEP);
			camera.update(STEP);
			Game.ChatBox.process(STEP);
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
			
			Game.ChatBox.draw(context, 0, canvas.height);
			
			if (room.currentShow <= 0.98) {
				context.fillStyle = "rgba(0, 0, 0, "+(1-room.currentShow)+")";
				context.fillRect(0, 0, canvas.width, canvas.height);
			}
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

function isPrintableChar(keycode) {
	return (keycode > 47 && keycode < 58)   || // number keys
        keycode == 32   || // spacebar
        (keycode > 64 && keycode < 91)   || // letter keys
        (keycode > 95 && keycode < 112)  || // numpad keys
        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
        (keycode > 218 && keycode < 223);   // [\]' (in order)
}

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
				Game.viewScale += 0.2;
				if (Game.viewScale > 1.7)
					Game.viewScale = 1.7;
				break;
			case 40:// down
				Game.viewScale -= 0.2;
				if (Game.viewScale < 1.3)
					Game.viewScale = 1.3;
				break;
			case 13://enter
				if (Game.ChatBox.userMessage.length > 0) {
					Game.ws.send({
						action: "message",
						id: Game.getPlayer().id,
						message: Game.ChatBox.userMessage
					});

					var matches = Game.ChatBox.userMessage.match(/^::(att|str|def|hp|agil|acc|mage|herb|mine|smith) (-?\d+)$/);
					if (matches != null) {
						Game.getPlayer().stats.gainExp(matches[1], parseInt(matches[2]));
					}
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