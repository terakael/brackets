(function() {
	function GroundItem(item, x, y, id) {
		this.item = item;
		this.pos = {x: x, y: y};
		this.clickBox = new Game.Rectangle(x - ~~(item.spriteFrame.frames[0].width/2), y - ~~(item.spriteFrame.frames[0].height/2), item.spriteFrame.frames[0].width, item.spriteFrame.frames[0].height);
		this.groundItemId = id;
	};

	GroundItem.prototype.draw = function(ctx, xview, yview, sx, sy) {
		this.item.draw(ctx, (this.pos.x - xview) * (1/sx), (this.pos.y - yview) * (1/sy));
	};

	GroundItem.prototype.process = function(dt) {

	};
	
	Game.GroundItem = GroundItem;
})();