$(function(){
     // prepare our game canvas
    var canvas = document.getElementById("game");
    var context = canvas.getContext("2d");
    
    var clickpoints = [];
    canvas.addEventListener("mousedown", function(e) {
        clickpoints.push(Game.mousePos);
    }, false);
    
    Game.isometric = true;
    Game.boundingRect = canvas.getBoundingClientRect();

    // game settings:	
    var FPS = 50;
    var INTERVAL = 1000/FPS; // milliseconds
    var STEP = INTERVAL/1000 // seconds

    // setup an object that represents the room
    var room = {
        width: 3000,
        height: 3000,
        map: new Game.Map(3000, 3000, canvas.width, canvas.height),
        player: new Game.Player(1000, 1000),
        draw: function(ctx, xview, yview) {
            if (Game.isometric) {
                ctx.save();
                ctx.translate(this.player.x - xview, this.player.y - yview);
                ctx.scale(1, 1/1.5);
                ctx.rotate(45 * Math.PI / 180);
                ctx.translate(-(this.player.x - xview), -(this.player.y - yview));
            }
//            var isopos = Game.mousePos;
//            isopos.y *= 1/1.5;
//            var dir = {x: isopos.x - this.player.x, y: isopos.y - this.player.y};
//            var len = Math.getVectorMagnitude(dir);
//            var diff = Math.getVectorNormal(dir);
//            var rotRad = Math.atan2(diff.y, diff.x);
//            
//            var rotated = {
//                x: diff.x * Math.cos(rotRad) - diff.y * Math.sin(rotRad),
//                y: diff.x * Math.sin(rotRad) + diff.y * Math.cos(rotRad)
//            };
//            
//            cursor.setPos({x: ~~(rotated.x * len), y: ~~(rotated.y * len)});
            this.map.draw(ctx, xview, yview);
            for (var i = 0; i < clickpoints.length; ++i) {
                ctx.fillRect(clickpoints[i].x - xview, clickpoints[i].y - yview, 32, 32);
            }
            
            cursor.draw(ctx, xview, yview);
            
            if (Game.isometric)
                ctx.restore();        
            this.player.draw(ctx, xview, yview);
        },
        process: function(dt) {
            this.player.process(dt, this.width, this.height);
        }
    };
	
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
        room.player.image = playerspritemap;
    }

    // setup the magic camera !!!
    var camera = new Game.Camera(-100, 0, canvas.width-250, canvas.height, room.width, room.height);		
    camera.follow(room.player, (canvas.width-250-(room.player.width/2))/2, (canvas.height)/2);
    
    var hudcamera = new Game.Camera(camera.viewportRect.width, 0, canvas.width - camera.viewportRect.width, canvas.height);
	
	room.player.inventory = new Game.Inventory();
    
    var cursor = new Game.Cursor((hudcamera.xView + hudcamera.wView) - 10, hudcamera.yView + 20);
    
    var grid = new Game.Grid();
    grid.createGridLines(camera.viewportRect.width, camera.viewportRect.height);
    
    // Game update function
    var update = function() {
        room.process(STEP);
        
        camera.update(STEP);
		Game.ChatBox.process(STEP);
    }
    var counter = 0;
    // Game draw function
    var draw = function(){        
        // redraw all room objects
        context.fillStyle = "#050";
        //context.clearRect(0, 0, camera.viewportRect.width, camera.viewportRect.height);
        context.fillRect(0, 0, camera.viewportRect.width, camera.viewportRect.height);
        room.draw(context, camera.xView, camera.yView);
        
        // redraw all hud objects
        context.fillStyle = hudcamera.pat || "black";
        context.fillRect(hudcamera.xView, hudcamera.yView, hudcamera.viewportRect.width, hudcamera.viewportRect.height);
        
        Game.Minimap.draw(context, hudcamera.xView, 0);
        room.player.inventory.draw(context, hudcamera.xView, hudcamera.yView + Game.Minimap.height + 20);
        room.player.stats.draw(context, hudcamera.xView, hudcamera.viewportRect.height - ((room.player.stats.stats.length + 1) * room.player.stats.y));
		
        Game.ChatBox.draw(context, 0, canvas.height);
    }

    // Game Loop
    var gameLoop = function(){        				
        update();
        draw();
    }

    // <-- configure play/pause capabilities:

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

    // -->

});

// <-- configure Game controls:

Game.controls = {
    left: false,
    up: false,
    right: false,
    down: false,
};

window.addEventListener("keydown", function(e){
    switch(e.keyCode)
    {
        case 65: // left arrow
            Game.controls.left = true;
            break;
        case 87: // up arrow
            Game.controls.up = true;
            break;
        case 68: // right arrow
            Game.controls.right = true;
            break;
        case 83: // down arrow
            Game.controls.down = true;
            break;
    }
}, false);

window.addEventListener("keyup", function(e){
    switch(e.keyCode)
    {
        case 65: // left arrow
            Game.controls.left = false;
            break;
        case 87: // up arrow
            Game.controls.up = false;
            break;
        case 68: // right arrow
            Game.controls.right = false;
            break;
        case 83: // down arrow
            Game.controls.down = false;
            break;
        case 80: // key P pauses the game
            Game.togglePause();
            break;
        case 73: // i
            Game.isometric = !Game.isometric;
            break;
    }
}, false);

Game.getMousePos = function(e) {
    return {x: e.clientX - Game.boundingRect.left, y: e.clientY - Game.boundingRect.top};
}
window.addEventListener("mousemove", function(e) {
    Game.mousePos = Game.getMousePos(e);
});



// -->

// start the game when page is loaded
window.onload = function(){	
    Game.play();
}