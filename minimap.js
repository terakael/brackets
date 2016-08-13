(function() {
	function Minimap() {
		this.width = 230;
		this.height = 230;
	};
	Minimap.prototype = {
		constructor: Minimap,
		draw: function(context, xview, yview) {
			context.save();
			context.fillStyle = "#050";
			context.strokeStyle = "#666";
			context.lineWidth = 3;
			context.fillRect(xview + 10, yview + 10, this.width, this.height);
			context.strokeRect(xview + 10, yview + 10, this.width, this.height);
			context.restore();
		},
		process: function(dt) {
		}
	};
	
	Game.Minimap = new Minimap();
})();