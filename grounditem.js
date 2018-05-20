(function() {
	function GroundItem(item, x, y, id) {
		this.item = item;
		this.pos = {x: x, y: y};
		this.clickBox = new Game.Rectangle(x - ~~(item.spriteFrame.rect.width/2), y - ~~(item.spriteFrame.rect.height/2), item.spriteFrame.rect.width, item.spriteFrame.rect.height);
		this.groundItemId = id;
	};

	GroundItem.prototype.draw = function(ctx, xview, yview, sx, sy) {
		this.item.draw(ctx, (this.pos.x - xview) * (1/sx), (this.pos.y - yview) * (1/sy));
	};

	GroundItem.prototype.process = function(dt) {

	};
	
	Game.GroundItem = GroundItem;
})();