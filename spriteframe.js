class SpriteFrame {
	constructor(obj) {
		//{"id":1,"sprite_map_id":1,"x":0,"y":140,"w":32,"h":32,"anchorX":0.5,"anchorY":0.95,"margin":0,"frame_count":1,"animation_type_id":1}
		this.frameData = obj;
		this.id = obj.id;
		this.spriteMapId = obj.sprite_map_id;
		this.margin = obj.margin;
		this.frameCount = obj.frame_count;
		this.animationTypeId = obj.animation_type_id;
		this.forwards = true;
		this.frameSpeed = obj.framerate == undefined ? 0.1 : 1/obj.framerate;// e.g. framerate of 60 is 1/60 frame speed
		this.frameTimer = this.frameSpeed;
		this.anchor = {x: obj.anchorX || 0.5, y: obj.anchorY || 0.5};
		this.scale = {x: obj.scaleX || 1, y: obj.scaleY || 1};
		this.color = obj.color;

		this.frames = [];
		for (var i = 0; i < this.frameCount; ++i) {
			this.frames.push(new Rectangle((obj.x + (this.margin * i) + (obj.w * i)), obj.y, obj.w, obj.h));
		}

		this.customBoundingBoxes = new Map();
		if (obj.customBoundingBoxes) {
			for (const [frameId, frameData] of Object.entries(obj.customBoundingBoxes)) {
				// framedata is x y w h in pct format (0-1)
				this.customBoundingBoxes.set(Number(frameId), new Rectangle(frameData.xPct * obj.w * this.scale.x, frameData.yPct * obj.h * this.scale.y, frameData.wPct * obj.w * this.scale.x, frameData.hPct * obj.h * this.scale.y));
			}
		}

		this.currentFrame = 0;
	}

	setScale(scale) {
		this.scale = {x: scale.x, y: scale.y};
	}

	getBoundingBox() {
		const rect = this.customBoundingBoxes.has(this.currentFrame) 
						? this.customBoundingBoxes.get(this.currentFrame) 
						: new Rectangle(0, 0, this.getCurrentFrame().width * this.scale.x, this.getCurrentFrame().height * this.scale.y);

		return new Rectangle(-(this.getCurrentFrame().width * this.scale.x * this.anchor.x) + rect.left,
								  -(this.getCurrentFrame().height * this.scale.y * this.anchor.y) + rect.top,
								  rect.width,
								  rect.height);
	}
	
	draw(ctx, x, y, color) {
		color = color || this.color;
		let spriteMap = SpriteManager.getSpriteMapById(this.spriteMapId);
		if (!spriteMap)
			return; // maybe sprite map hasn't finished loading yet

		if (color) {
			let spriteMapObj = SpriteManager.getSpriteMapByIdAndColor(this.spriteMapId, color);
			if (spriteMapObj && spriteMapObj.ready) {
				spriteMap = spriteMapObj.map;
			} else if (!spriteMapObj) {
				let c = Game.otherContext;
				c.canvas.width = spriteMap.width;
				c.canvas.height = spriteMap.height;
				c.clearRect(0, 0, c.canvas.width, c.canvas.height);
				
				c.globalCompositeOperation = "source-over";
				c.drawImage(spriteMap, 0, 0, spriteMap.width, spriteMap.height);

				let hsl = decToHsl(color);

				// adjust "lightness"
				c.globalCompositeOperation =  "color-dodge";
				// for common slider, to produce a valid value for both directions
				const l = hsl.l >= 100 ? hsl.l - 100 : 100 - (100 - hsl.l);
				c.fillStyle = "hsl(0, 50%, " + hsl.l + "%)";
				c.fillRect(0, 0, spriteMap.width, spriteMap.height);
				
				// adjust saturation
				c.globalCompositeOperation = "saturation";
				c.fillStyle = "hsl(0," + hsl.s + "%, 50%)";
				c.fillRect(0, 0, spriteMap.width, spriteMap.height);
			
				// adjust hue
				c.globalCompositeOperation = "hue";
				c.fillStyle = "hsl(" + hsl.h + ",1%, 50%)";
				c.fillRect(0, 0, spriteMap.width, spriteMap.height);

				c.globalCompositeOperation = "destination-in";
				c.drawImage(spriteMap, 0, 0, spriteMap.width, spriteMap.height);

				let spriteMapId = this.spriteMapId;
				console.log("creating new colored spritemap: id=" + spriteMapId + "; color=" + color);
				let map = new Image();
				map.src = c.canvas.toDataURL();
				let spriteMapWithColor = {
					id: spriteMapId,
					name: "",
					map: map,
					color: color,
					ready: false
				};
				SpriteManager.spriteMapsWithColor.push(spriteMapWithColor);
				map.onload = function() {
					spriteMapWithColor.ready = true;
					console.log("created new colored spritemap: id=" + spriteMapId + "; color=" + color);
				}
			}
		}

		if (spriteMap) {
			this.drawImage(ctx, x, y, spriteMap);
		}
	}

	drawImage(ctx, x, y, spriteMap) {
		ctx.mozImageSmoothingEnabled = Game.enableSmoothing;
		ctx.webkitImageSmoothingEnabled = Game.enableSmoothing;
		ctx.msImageSmoothingEnabled = Game.enableSmoothing;
		ctx.imageSmoothingEnabled = Game.enableSmoothing;

		ctx.drawImage(spriteMap, 
			this.frames[this.currentFrame].left + 0.5, 
			this.frames[this.currentFrame].top + 0.5, 
			this.frames[this.currentFrame].width-1, 
			this.frames[this.currentFrame].height-1, 
			x-((this.frames[this.currentFrame].width * this.scale.x) * this.anchor.x), 
			y-((this.frames[this.currentFrame].height * this.scale.y) * this.anchor.y), 
			this.frames[this.currentFrame].width * this.scale.x, 
			this.frames[this.currentFrame].height * this.scale.y);
	}

	drawDetailed(ctx, sx, sy, sw, sh, dx, dy, dw, dh) {
		let spriteMap = SpriteManager.getSpriteMapById(this.spriteMapId);
		if (spriteMap)
			ctx.drawImage(spriteMap, sx, sy, sw, sh, dx, dy, dw, dh);
	}

	getCurrentFrame() {
		return this.frames[this.currentFrame];
	}

	process(dt) {
		this.frameTimer -= dt;
        if (this.frameTimer < 0 && this.frameSpeed > 0) {
            // time to switch frames        
            this.frameTimer = this.frameSpeed;    
            this.nextFrame();
        }
	};

	nextFrame() {
		switch (this.animationTypeId) {
			case 4:// fall through, this is ping pong but always animate
			case 2: {// ping pong
				if (this.forwards) {
					if ((this.currentFrame + 1) >= this.frames.length) {
						this.forwards = !this.forwards;
						--this.currentFrame;
					} else {
						++this.currentFrame;
					}
				} else {
					if (this.currentFrame - 1 < 0) {
						this.forwards = !this.forwards;
						++this.currentFrame;
					} else {
						--this.currentFrame;
					}
				}
				break;
			}
			default: {
				if (this.forwards && ++this.currentFrame >= this.frames.length) {
					this.currentFrame = 0;
				} else if (!this.forwards && --this.currentFrame < 0) {
					this.currentFrame = this.frames.length - 1;
				}
				break;
			}
		}
	}

	alwaysAnimate() {
		return this.animationTypeId === 4;
	}
}