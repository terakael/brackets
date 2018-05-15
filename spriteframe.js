(function() {
	function SpriteFrame(obj) {
		//{"id":1,"sprite_map_id":1,"x":0,"y":140,"w":32,"h":32,"margin":0,"frame_count":1,"animation_type_id":1}
		this.id = obj.id;
		this.spriteMapId = obj.sprite_map_id;
		this.rect = new Game.Rectangle(obj.x, obj.y, obj.w, obj.h);
		this.margin = obj.margin;
		this.frameCount = obj.frame_count;
		this.animationTypeId = obj.animation_type_id;
	};

	SpriteFrame.prototype.draw = function(ctx, x, y) {
		if (this.spriteMap == null) {
			this.spriteMap = Game.SpriteManager.getSpriteMapById(this.spriteMapId);
		}

		if (this.spriteMap)
			ctx.drawImage(this.spriteMap, this.rect.left, this.rect.top, this.rect.width, this.rect.height, x-(this.rect.width/2), y-(this.rect.height/2), this.rect.width, this.rect.height);
		
	};

	SpriteFrame.prototype.process = function(dt) {

	};
	
	Game.SpriteFrame = SpriteFrame;
})();