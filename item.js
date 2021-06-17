// (function() {
// 	function Item(obj) {
// 		this.id = obj.id;
// 		this.name = obj.name;
// 		this.leftclickOption = obj.leftclickOption;
// 		this.otherOptions = obj.otherOptions;
// 		this.spriteFrame = obj.spriteFrame;
// 		this.attributes = obj.attributes;
// 		this.shiftclickOption = obj.shiftclickOption;
// 	};

// 	Item.prototype.draw = function(ctx, x, y) {
// 		this.spriteFrame.draw(ctx, x, y);
// 	};

// 	Item.prototype.process = function(dt) {

// 	};

// 	Item.prototype.isStackable = function() {
// 		return this.attributes & 1;
// 	}

// 	Item.prototype.isCharged = function() {
// 		return this.attributes & 8;
// 	}
	
// 	Game.Item = Item;
// })();


class Item {
	constructor(obj) {
		this.id = obj.id;
		this.name = obj.name;
		this.leftclickOption = obj.leftclickOption;
		this.otherOptions = obj.otherOptions;
		this.spriteFrame = obj.spriteFrame;
		this.attributes = obj.attributes;
		this.shiftclickOption = obj.shiftclickOption;
	}

	draw(ctx, x, y) {
		this.spriteFrame.draw(ctx, x, y);
	}

	process(dt) {

	}

	isStackable() {
		return this.attributes & 1;
	}

	isCharged() {
		return this.attributes & 8;
	}
}