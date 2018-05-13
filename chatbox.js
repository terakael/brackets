(function() {
	function ChatBox() {
	};
	ChatBox.prototype = {
		constructor: ChatBox,
		numLines: 10,
		timeout: 30,
		userMessage: '',
		messages: [],
		add: function(t, c) {
			this.messages.push({text: t, colour: c, lifetime: this.timeout});
			
			if (this.messages.length >= this.numLines) {
				this.messages = this.messages.slice(this.messages.length - this.numLines, this.messages.length);
			}
		},
		draw: function(context, xview, yview) {
			context.save();
			context.font = "15px Consolas";
			for (var i = this.messages.length-1; i >= 0; --i) {
				context.fillStyle = this.messages[i].colour || "white";
				context.fillText(this.messages[i].text, xview + 10, yview - (20 * (this.messages.length - i)) - 20);
			}
			context.fillStyle = 'yellow';
			context.fillText(Game.getPlayer().name + ": " + this.userMessage + '*', xview + 10, yview - 20);
			context.restore();
		},
		process: function(dt) {
			for (var i = 0; i < this.messages.length; ++i) {
				this.messages[i].lifetime -= dt;
				if (this.messages[i].lifetime < 0)
					this.messages.splice(i, 1);
			}
		}
	};
	
	Game.ChatBox = new ChatBox();
})();