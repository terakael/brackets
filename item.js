(function() {
	function Item(obj) {
		this.id = obj.id;
		this.name = obj.name;
		this.description = obj.description;
		this.leftclickOption = obj.leftclickOption;
		this.otherOptions = obj.otherOptions;
		this.spriteFrame = obj.spriteFrame;

	};

	Item.prototype.draw = function(ctx, x, y) {
		this.spriteFrame.draw(ctx, x, y);
	};

	Item.prototype.process = function(dt) {

	};
	
	Game.Item = Item;
})();