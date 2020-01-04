(function() {
	function SpriteFrame(obj) {
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
		this.scale = {x: 1, y: 1};

		this.frames = [];
		for (var i = 0; i < this.frameCount; ++i) {
			let rect = new Game.Rectangle((obj.x + (this.margin * i) + (obj.w * i)), obj.y, obj.w, obj.h);
			this.frames.push(rect);
			//console.log(`created frame with: ${rect.left}, ${rect.top}, ${rect.right}, ${rect.bottom}`);
		}

		this.currentFrame = 0;
	};

	SpriteFrame.prototype.setScale = function(scale) {
		this.scale = {x: scale.x, y: scale.y};
	}

	SpriteFrame.prototype.draw = function(ctx, x, y) {
		let spriteMap = Game.SpriteManager.getSpriteMapById(this.spriteMapId);

		if (spriteMap) {
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
	};

	SpriteFrame.prototype.getCurrentFrame = function() {
		return this.frames[this.currentFrame];
	}

	SpriteFrame.prototype.process = function(dt) {
		this.frameTimer -= dt;
        if (this.frameTimer < 0 && this.frameSpeed > 0) {
            // time to switch frames        
            this.frameTimer = this.frameSpeed;    
            this.nextFrame();
        }
	};

	SpriteFrame.prototype.nextFrame = function() {
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

	SpriteFrame.prototype.alwaysAnimate = function() {
		return this.animationTypeId === 4;
	}
	
	Game.SpriteFrame = SpriteFrame;
})();