(function() {
	function Minimap() {
		this.otherPlayers = null;
		this.groundItems = null;
		this.npcs = null;

		// its a square but basically from the player in the middle to the edge of the square
		// the client sends us npcs/players within a 15 square radius, i.e. 480 pixels, so 500 away being the edge is a nice round number
		this.radius = 500;
		this.rect = new Rectangle(0, 0, 0, 0);
		this.playerDestTile = 0;
		this.images = new Map(); // tileId, minimapSegmentImage
		this.minimapIcons = new Map();
	};
	Minimap.prototype = {
		constructor: Minimap,
		draw: function(context, xview, yview) {
			for (const [tileId, image] of this.images) {
				let xy = tileIdToXY(tileId);
				let diffx = xy.x - Game.getPlayer().x;
				let diffy = xy.y - Game.getPlayer().y;

				let dx = ((this.rect.left + (this.rect.width/2)) + (diffx/this.radius*(this.rect.width/2))) - 2.5;
				let sx = 0;
				if (dx < this.rect.left) {
					sx = (this.rect.left - dx) / (185/50);
				}
				let dy = ((this.rect.top + (this.rect.height/2)) + (diffy/this.radius*(this.rect.width/2))) - 2.5;
				let sy = 0;
				if (dy < this.rect.top) {
					sy = (this.rect.top - dy) / (185/50);
				}

				let sw = 50;
				if (dx + 185 > this.rect.right)
					sw = (this.rect.right - dx) / (185/50);

				let sh = 50;
				if (dy + 185 > this.rect.bottom) {
					sh = (this.rect.bottom - dy) / (185/50);
				}

				context.drawImage(image, sx, sy, sw, sh, dx + (sx * (185/50)), dy + (sy * (185/50)), sw * (185/50), sh * (185/50));
			}

			for (const [spriteFrameId, tileIds] of this.minimapIcons) {
				let spriteFrame = SpriteManager.getSpriteFrameById(spriteFrameId);
				if (!spriteFrame)
					continue;

				const orderedTileIds = tileIds.sort((a, b) => a - b);
				for (let i = 0; i < orderedTileIds.length; ++i) {
					let xy = tileIdToXY(orderedTileIds[i]);
					let diffx = xy.x - Game.getPlayer().x;
					let diffy = xy.y - Game.getPlayer().y;

					let frame = spriteFrame.getCurrentFrame();

					if (Math.abs(diffx) + (frame.width * spriteFrame.scale.x) > 500 || Math.abs(diffy) + (frame.height * spriteFrame.scale.y) > 500)
					 	continue;

					
					// let dx = ((this.rect.left + (this.rect.width/2)) + (diffx/this.radius*(this.rect.width/2))) - 2.5;
					// let sx = 0;
					// if (dx < this.rect.left) {
					// 	sx = (this.rect.left - dx) / (frame.width * spriteFrame.scale.x);
					// }
					// let dy = ((this.rect.top + (this.rect.height/2)) + (diffy/this.radius*(this.rect.width/2))) - 2.5;
					// let sy = 0;
					// if (dy < this.rect.top) {
					// 	sy = (this.rect.top - dy) / (frame.height * spriteFrame.scale.y);
					// }

					// let sw = (frame.width * spriteFrame.scale.x);
					// if (dx + (frame.width * spriteFrame.scale.x) > this.rect.right)
					// 	sw = (this.rect.right - dx) / (frame.width * spriteFrame.scale.x);

					// let sh = frame.height;
					// if (dy + frame.height > this.rect.bottom) {
					// 	sh = (this.rect.bottom - dy) / (frame.height * spriteFrame.scale.y);
					// }

					// spriteFrame.drawDetailed(context, sx, sy, sw, sh, 
					// 	dx + (sx * (frame.width * spriteFrame.scale.x)), 
					// 	dy + (sy * (frame.height * spriteFrame.scale.y)), 
					// 	sw, 
					// 	sh);
					spriteFrame.draw(context, 
						((this.rect.left + (this.rect.width/2)) + (diffx/this.radius*(this.rect.width/2))) + 2.5, 
						((this.rect.top + (this.rect.height/2)) + (diffy/this.radius*(this.rect.width/2))) + 2.5);
				}
			}

			context.fillStyle = "#050";
			context.strokeStyle = "#666";
			context.lineWidth = 3;
			context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

			// current player dot (always centred)
			context.fillStyle = "white";
			context.fillRect((this.rect.left + (this.rect.width/2)) - 2.5, (this.rect.top + (this.rect.height/2)) - 2.5, 5, 5);

			// npcs
			context.fillStyle = "yellow";
			for (var i in this.npcs) {
				this.drawOnMap(context, this.npcs[i].pos.x, this.npcs[i].pos.y);
			}
			
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
			
			if (Math.abs(Game.getPlayer().x - this.playerDestX) > 32 || Math.abs(Game.getPlayer().y - this.playerDestY) > 32) {
				context.fillStyle = "red";
				this.drawOnMap(context, this.playerDestX, this.playerDestY, 15, "x");
			}
		},
		drawOnMap: function(context, x, y, size, icon) {
			var diffx = x - Game.getPlayer().x;
			var diffy = y - Game.getPlayer().y;
			context.font = "bold {0}px customFont".format(size || 12);
			context.textAlign = "center";
			context.textBaseline = "middle";
			if (Math.abs(diffx) < this.radius && Math.abs(diffy) < this.radius) {
				context.fillText(icon || ".", 
					((this.rect.left + (this.rect.width/2)) + (diffx/this.radius*(this.rect.width/2))), 
					((this.rect.top + (this.rect.height/2)) + (diffy/this.radius*(this.rect.width/2))));
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
		setNpcs: function(npcs) {
			this.npcs = npcs;
		},
		onMouseDown: function(button) {
			var x = ((Game.mousePos.x - (this.rect.left + (this.rect.width/2))) / (this.rect.width/2)) * this.radius;
			var y = ((Game.mousePos.y - (this.rect.top + (this.rect.height/2))) / (this.rect.height/2)) * this.radius;

			if (Game.ctrlPressed) {
				let tileId = xyToTileId(~~(Game.getPlayer().x + x), ~~(Game.getPlayer().y + y));
				Game.ws.send({
					action: "message",
					id: Game.getPlayer().id,
					message: `::tele ${tileId}`
				});
			} else {
				Game.ws.send({action: "move", id: Game.getPlayer().id, x: ~~(Game.getPlayer().x + x), y: ~~(Game.getPlayer().y + y)});
			}
			this.setPlayerDestXY(~~(Game.getPlayer().x + x), ~~(Game.getPlayer().y + y));
			
		},
		setRect: function(x, y, w, h) {
			this.rect = new Rectangle(x, y, w, h);
		},
		setPlayerDestXY: function(x, y) {
			this.playerDestX = ~~x - (~~x % 32) + 16;
			this.playerDestY = ~~y - (~~y % 32) + 16;
		},
		load: function(image, segmentId) {
			this.images.set(this.tileIdFromSegmentId(segmentId), image);
		},
		removeMinimapsBySegmentId: function(segmentId) {
			const topLeftTileId = this.tileIdFromSegmentId(segmentId);
			this.images.delete(topLeftTileId);

			const topLeftTileX = topLeftTileId % Game.worldTileWidth;
			const topLeftTileY = Math.floor(topLeftTileId / Game.worldTileWidth);
			for (let [spriteMapId, tileIds] of this.minimapIcons) {
				this.minimapIcons.set(spriteMapId, tileIds.filter(e => {
					const tileX = e % Game.worldTileWidth;
					const tileY = Math.floor(e / Game.worldTileWidth);

					return !((tileX >= topLeftTileX && tileX < topLeftTileX + Game.segmentWidth) && (tileY >= topLeftTileY && tileY < topLeftTileY + Game.segmentWidth));
				}));
			}
		},
		tileIdFromSegmentId: function(segmentId) {
			const segmentX = segmentId % Game.worldSegmentWidth();
			const segmentY = Math.floor(segmentId / Game.worldSegmentWidth());

			const tileX = segmentX * Game.segmentWidth;
			const tileY = segmentY * Game.segmentWidth;

			return (tileY * Game.worldTileWidth) + tileX;
		},
		addMinimapIconLocations: function(iconLocations) {
			for (const [spriteMapId, tileIds] of Object.entries(iconLocations)) {
				this.minimapIcons.set(Number(spriteMapId), tileIds.concat(this.minimapIcons.get(Number(spriteMapId)) || []));
			}
		}
	};
	
	Game.Minimap = new Minimap();
})();