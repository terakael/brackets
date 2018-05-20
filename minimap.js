(function() {
	function Minimap() {
		this.width = 230;
		this.height = 230;
		this.otherPlayers = null;
		this.groundItems = null;
		this.radius = 1000;// its a square but basically from the player in the middle to the edge of the square
		this.rect = new Game.Rectangle(0, 0, 0, 0);
	};
	Minimap.prototype = {
		constructor: Minimap,
		draw: function(context, xview, yview) {
			// minimap background
			if (Game.currentMap.image)
				context.drawImage(Game.currentMap.image, 
								  (Game.currentMap.image.width * (Game.getPlayer().x / Game.currentMap.width)) - (Game.currentMap.image.width/2), 
								  (Game.currentMap.image.height * (Game.getPlayer().y / Game.currentMap.height)) - (Game.currentMap.image.height/2), 
								  Game.currentMap.image.width * ((this.radius*2)/Game.currentMap.image.width), 
								  Game.currentMap.image.height * ((this.radius*2)/Game.currentMap.image.height), 
								  this.rect.left, this.rect.top, this.rect.width, this.rect.height);

			context.fillStyle = "#050";
			context.strokeStyle = "#666";
			context.lineWidth = 3;
			context.strokeRect(this.rect.left, this.rect.top, this.width, this.height);

			// current player dot (always centred)
			context.fillStyle = "white";
			context.fillRect((this.rect.left + (this.width/2)) - 2.5, (this.rect.top + (this.height/2)) - 2.5, 5, 5);

			// other players
			context.fillStyle = "white";
			for (var i in this.otherPlayers) {
				this.drawOnMap(context, this.otherPlayers[i].x, this.otherPlayers[i].y);
			}

			// ground items
			context.fillStyle = "#f00";
			for (var i in this.groundItems) {
				this.drawOnMap(context, this.groundItems[i].pos.x, this.groundItems[i].pos.y, 15);
			}
		},
		drawOnMap: function(context, x, y, size) {
			var diffx = x - Game.getPlayer().x;
			var diffy = y - Game.getPlayer().y;
			context.font = "bold {0}px Consolas".format(size || 12);
			context.textAlign = "center";
			if (Math.abs(diffx) < this.radius && Math.abs(diffy) < this.radius) {
				context.fillText("x", ((this.rect.left + (this.width/2)) + (diffx/this.radius*(this.width/2))), ((this.rect.top + (this.height/2)) + (diffy/this.radius*(this.width/2))) + 2.5);
			}
		},
		process: function(dt) {
		},
		setOtherPlayers: function(otherPlayerArray) {
			this.otherPlayers = otherPlayerArray;
		},
		setGroundItems: function(groundItemArray) {
			this.groundItems = groundItemArray;
		},
		onMouseDown: function(button) {
			var x = ((Game.mousePos.x - (this.rect.left + (this.width/2))) / (this.width/2)) * this.radius;
			var y = ((Game.mousePos.y - (this.rect.top + (this.height/2))) / (this.height/2)) * this.radius;
			Game.ws.send({action: "move", id: Game.getPlayer().id, x: ~~(Game.getPlayer().x + x), y: ~~(Game.getPlayer().y + y)});
		},
		setRect: function(x, y, w, h) {
			this.rect = new Game.Rectangle(x, y, w, h);
		}
	};
	
	Game.Minimap = new Minimap();
})();