(function() {
	function Item(obj) {
		this.id = obj.id;
		this.name = obj.name;
		this.leftclickOption = obj.leftclickOption;
		this.otherOptions = obj.otherOptions;
		this.spriteFrame = obj.spriteFrame;
		this.attributes = obj.attributes;
	};

	Item.prototype.draw = function(ctx, x, y) {
		this.spriteFrame.draw(ctx, x, y);
	};

	Item.prototype.process = function(dt) {

	};

	Item.prototype.isStackable = function() {
		return this.attributes & 1;
	}
	
	Game.Item = Item;
})();