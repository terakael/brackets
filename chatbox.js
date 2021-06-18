class ChatBox {
	static numLines = 10;
	static timeout = 30;
	static userMessage = "";
	static messages = [];

	static add(text, colour) {
		this.messages.push({text, colour, lifetime: this.timeout});
		
		if (this.messages.length > this.numLines) {
			this.messages.shift();
		}
	}

	static draw(context, xview, yview) {
		context.save();
		context.textAlign = "left";
		context.font = "15px customFont";

		for (let i = this.messages.length - 1; i >= 0; --i) {
			context.fillStyle = this.messages[i].colour || "white";
			context.fillText(this.messages[i].text, xview + 10, yview - (20 * (this.messages.length - i)) - 20);
		}

		context.fillStyle = 'yellow';
		context.fillText(`${Game.currentPlayer.name}: ${this.userMessage}*`, xview + 10, yview - 20);
		context.restore();
	}

	static process(dt) {
		this.messages.forEach(message => message.lifetime -= dt);
		this.messages = this.messages.filter(message => message.lifetime > 0);
	}
}