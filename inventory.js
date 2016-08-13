(function() {
	function Inventory() {
		this.slots = 20;
		this.slotSize = 46;
		this.columns = 5;
	};
	Inventory.prototype = {
		constructor: Inventory,
		draw: function(context, xview, yview) {
			context.save();
			context.fillStyle = "#666";
			context.fillText("Inventory", xview + 10, yview + 10);
			context.fillRect(xview + 9, yview + 18, this.columns * this.slotSize + 2, ~~(this.slots / this.columns) * this.slotSize + 2);
			context.fillStyle = "#222";

			for (var i = 0; i < this.slots; ++i) {
				context.fillRect((xview + 11) + (i%this.columns) * this.slotSize, (yview + 20) + (~~(i/this.columns) * this.slotSize), this.slotSize-2, this.slotSize-2);
			}
			context.restore();
		},
		process: function(dt) {
		}
	};
	
	Game.Inventory = Inventory;
})();