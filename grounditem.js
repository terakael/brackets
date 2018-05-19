(function() {
	function GroundItem(item, x, y, id) {
		this.item = item;
		this.pos = {x: x, y: y};
		this.clickBox = new Game.Rectangle(x - ~~(item.spriteFrame.rect.width/2), y - ~~(item.spriteFrame.rect.height/2), item.spriteFrame.rect.width, item.spriteFrame.rect.height);
		this.groundItemId = id;
	};

	GroundItem.prototype.draw = function(ctx, xview, yview) {
		this.item.draw(ctx, this.pos.x - xview, this.pos.y - yview);
	};

	GroundItem.prototype.process = function(dt) {

	};
	
	Game.GroundItem = GroundItem;
})();