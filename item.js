(function() {
	function Item(obj) {
		this.id = obj.id;
		this.name = obj.name;
		this.leftclickOption = obj.leftclickOption;
		this.otherOptions = obj.otherOptions;
		this.spriteFrame = obj.spriteFrame;
		this.attributes = obj.attributes;
		this.shiftclickOption = obj.shiftclickOption;
	};

	Item.prototype.draw = function(ctx, x, y) {
		// ctx.save();
		// ctx.fillStyle = "red";
		// ctx.globalCompositeOperation = "color";
		// ctx.fillStyle = "hsl(" + 1 + "," + 100 + "%, 100%)";
		
		// ctx.fillRect(x - ((this.spriteFrame.frames[this.spriteFrame.currentFrame].width * this.spriteFrame.scale.x) * this.spriteFrame.anchor.x), 
		// 			y - ((this.spriteFrame.frames[this.spriteFrame.currentFrame].height * this.spriteFrame.scale.y) * this.spriteFrame.anchor.y), 
		// 			this.spriteFrame.frames[this.spriteFrame.currentFrame].width * this.spriteFrame.scale.x,
		// 			this.spriteFrame.frames[this.spriteFrame.currentFrame].height * this.spriteFrame.scale.y);
		
		// ctx.globalCompositeOperation = "source-over";
		// this.spriteFrame.draw(ctx, x, y);

		// ctx.globalCompositeOperation = "destination-in";
		// ctx.filter = "grayscale(100%)";
		this.spriteFrame.draw(ctx, x, y);

		// ctx.globalCompositeOperation = "source-over";

		// ctx.globalCompositeOperation = "destination-in";
		// this.spriteFrame.draw(ctx, x, y);

		// ctx.restore();
	};

	Item.prototype.process = function(dt) {

	};

	Item.prototype.isStackable = function() {
		return this.attributes & 1;
	}

	Item.prototype.isCharged = function() {
		return this.attributes & 8;
	}
	
	Game.Item = Item;
})();