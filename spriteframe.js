(function() {
	function SpriteFrame(obj) {
		//{"id":1,"sprite_map_id":1,"x":0,"y":140,"w":32,"h":32,"margin":0,"frame_count":1,"animation_type_id":1}
		this.frameData = obj;
		this.id = obj.id;
		this.spriteMapId = obj.sprite_map_id;
		this.margin = obj.margin;
		this.frameCount = obj.frame_count;
		this.animationTypeId = obj.animation_type_id;
		this.forwards = true;
		this.frameSpeed = 0.1;
		this.frameTimer = 0.1;
		this.anchor = {x: obj.anchorX || 0.5, y: obj.anchorY || 0.5};

		this.frames = [];
		for (var i = 0; i < this.frameCount; ++i) {
			this.frames.push(new Game.Rectangle(obj.x + (this.margin * i) + (obj.w * i), obj.y, obj.w, obj.h));
		}

		this.currentFrame = 0;
	};

	SpriteFrame.prototype.draw = function(ctx, x, y) {
		if (this.spriteMap == null) {
			this.spriteMap = Game.SpriteManager.getSpriteMapById(this.spriteMapId);
		}

		if (this.spriteMap)
			ctx.drawImage(this.spriteMap, 
						  this.frames[this.currentFrame].left, 
						  this.frames[this.currentFrame].top, 
						  this.frames[this.currentFrame].width, 
						  this.frames[this.currentFrame].height, 
						  x-(this.frames[this.currentFrame].width * this.anchor.x), 
						  y-(this.frames[this.currentFrame].height * this.anchor.y), 
						  this.frames[this.currentFrame].width, 
						  this.frames[this.currentFrame].height);
		
	};

	SpriteFrame.prototype.getCurrentFrame = function() {
		return this.frames[this.currentFrame];
	}

	SpriteFrame.prototype.process = function(dt) {
		this.frameTimer -= dt;
        if (this.frameTimer < 0) {
            // time to switch frames        
            this.frameTimer = this.frameSpeed;    
            switch (this.animationTypeId) {
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
	};
	
	Game.SpriteFrame = SpriteFrame;
})();