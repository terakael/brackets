class ChatBox {
	static numLines = 10;
	static timeout = 30;
	static regex = /[a-zA-Z0-9 @#$-/:-?{-~!"^_`\[\]]/;
	static userMessage = "";
	static messages = [];

	static input = null;

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

		context.fillStyle = this.input ? "white" : "yellow";
		context.fillText(`${(this.input && this.input.inputMessage) || Game.currentPlayer.name}: ${this.userMessage}*`, xview + 10, yview - 20);
		context.restore();
	}

	static process(dt) {
		this.messages.forEach(message => message.lifetime -= dt);
		this.messages = this.messages.filter(message => message.lifetime > 0);
	}

	static requireInput(inputMessage, regex) {
		this.input = {
			inputMessage: inputMessage,
			userMessage: "",
			regex: regex
		};

		return {
			then: func => this.input.callback = func,
		}
	}

	static clearInput() {
		if (this.input) {
			this.input = null;
			this.userMessage = "";
		}
	}

	static onKeyDown(key) {
		switch (key) {
			case 13: {// enter
				if (this.userMessage.length > 0) {
					// todo list of client-side debug commands
					switch (this.userMessage) {
						case "::boundingBoxes":
							Game.drawBoundingBoxes = !Game.drawBoundingBoxes;
							this.add("turned bounding boxes " + (Game.drawBoundingBoxes ? "on." : "off."));
							break;

						case "::cursor": {
							Game.cursor.drawCursor = !Game.cursor.drawCursor;
							break;
						}

						case "::groundTextureOutline": {
							Game.drawGroundTextureOutline = !Game.drawGroundTextureOutline;
							break;
						}

						case "::fps": {
							Game.displayFps = !Game.displayFps;
							break;
						}

						case "::smoothing": {
							Game.enableSmoothing = !Game.enableSmoothing;
							break;
						}

						default: {
							if (this.input) {
								this.input.callback(this.userMessage);
								this.input = null;
							} else {
								Game.ws.send({
									action: "message",
									id: Game.currentPlayer.id,
									message: this.userMessage
								});
							}
							break;
						}
					}
					
					this.userMessage = "";
				} else {
					// enter on an empty message still clears any input
					ChatBox.clearInput();
				}
				break;
			}

			case 8: { // backspace
				if (this.userMessage.length > 0)
                    this.userMessage = this.userMessage.substring(0, this.userMessage.length - 1);
				break;
			}
		}
	}

	static onKeyPress(inp) {
		let regex = (this.input && this.input.regex) || this.regex;
		if (regex.test(inp)) {
            if (this.userMessage.length < 100)
                this.userMessage += inp;
            return;
        }
	}
}