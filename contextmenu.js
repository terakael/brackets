// a unit is an abstract superclass for npcs and players
// a unit has an inventory and stats, as well as a sprite with the following animations:
// walkup, walkdown, walkleft, walkright, fight, idle

(function() {
    function ContextMenu() {
    }

    ContextMenu.prototype = {
    	constructor: ContextMenu,
    	rect: new Rectangle(0, 0, 0, 0),
    	toleranceMargin: 10,
    	active: false,
    	menuOptions: [],
		menuOptionHeight: 20,
		leftclickMenuOption: null,
		leftclickPos: null,
		contextOptions: new Map(),
		characterWidth: 8.5,// for figuring out the width of the context menu based on longest string

        draw: function(ctx) {
			ctx.save();
			ctx.textAlign = "left";
			ctx.textBaseline = "middle";
			ctx.font = "12pt customFont";
			ctx.lineWidth = 1;

    		if (!this.active) {
				if (this.leftclickMenuOption != null) {
					ctx.save();

					var label = this.leftclickMenuOption.label || "{0} {1}".format(this.leftclickMenuOption.action, this.leftclickMenuOption.objectName);

					var rect = new Rectangle(
						this.leftclickPos.x, 
						this.leftclickPos.y,
						label.length * this.characterWidth + 10,
						this.menuOptionHeight);

					if (rect.left + rect.width > Game.boundingRect.right)
						rect.left = Game.boundingRect.right - rect.width - this.toleranceMargin;

					ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
					ctx.fillRect(rect.left, rect.top, rect.width, rect.height);

					ctx.strokeStyle = "red";
					ctx.strokeRect(rect.left + 0.5, rect.top + 0.5, rect.width, rect.height);

					// if the label includes the combat level of the opponent, we want to colour it according to the level difference
					let levelPart = "";
					if (label.includes("(lvl ")) {
						let idx = label.indexOf("(lvl ");
						levelPart = label.substring(idx);
						label = label.substring(0, idx);
					}

					ctx.fillStyle = "white";
					ctx.fillText(label, rect.left + 10, rect.top + (rect.height/2));

					if (levelPart) {
						let matches = levelPart.match(/\(lvl (\d+)\)/);
						ctx.font = "bold 12pt customFont";
						ctx.fillStyle = this.getFillStyleFromCombatLevelDifference(Game.currentPlayer.combatLevel, matches[1]);
						ctx.fillText(levelPart, rect.left + 10 + (~~ctx.measureText(label).width + 0.5), rect.top + (rect.height / 2));
					}

					ctx.restore();
				}
				return;
			}

	    	
	    	ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
	    	ctx.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

	    	var selectedOption = this.getSelectedOption();

	    	ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
	    	ctx.fillRect(this.rect.left, this.rect.top + (this.menuOptionHeight * selectedOption), this.rect.width, this.menuOptionHeight);

	    	ctx.strokeStyle = "red";
	    	ctx.strokeRect(this.rect.left + 0.5, this.rect.top + 0.5, this.rect.width, this.rect.height);

	    	for (var i = 0; i < this.menuOptions.length; ++i) {
				ctx.fillStyle = this.menuOptions[i].fillStyle || (i === selectedOption ? "yellow" : "white");

				// if the label includes the combat level of the opponent, we want to colour it according to the level difference
				let label = this.menuOptions[i].label;
				let levelPart = "";
				if (label.includes("(lvl ")) {
					let idx = label.indexOf("(lvl ");
					levelPart = label.substring(idx);
					label = label.substring(0, idx);
				}
				
				ctx.fillText(label, this.rect.left + 10, this.rect.top + ((this.menuOptionHeight * i) + (this.menuOptionHeight / 2)));
				
				if (levelPart) {
					ctx.save();
					let matches = levelPart.match(/\(lvl (\d+)\)/);
					ctx.font = "bold 12pt customFont";
					ctx.fillStyle = this.getFillStyleFromCombatLevelDifference(Game.currentPlayer.combatLevel, matches[1]);	
					ctx.fillText(levelPart, this.rect.left + 10 + (~~ctx.measureText(label).width + 0.5), this.rect.top + ((this.menuOptionHeight * i) + (this.menuOptionHeight / 2)));
					ctx.restore();
				}
	    	}

	    	ctx.restore();
    	},
    	process: function(dt) {
    		if (!this.active)
    			return;

    		if (Game.mousePos.x < this.rect.left - this.toleranceMargin || 
    			Game.mousePos.x > this.rect.left + this.rect.width + this.toleranceMargin ||
    			Game.mousePos.y < this.rect.top - this.toleranceMargin ||
    			Game.mousePos.y > this.rect.top + this.rect.height + this.toleranceMargin) {
    			this.hide();
    		}
    	},
    	show: function(x, y, xview, yview) {
    		if (this.active)
				return;

			this.originalPos = Game.mousePos;
				
            if (Game.worldCameraRect.pointWithin(Game.mousePos) && !Game.activeUiWindow) {
    	       this.menuOptions.push({label: "walk here", id: Game.currentPlayer.id, action: "move", x: x, y: y});
			}

			// push the "examine" option to the bottom
			// this.menuOptions.sort((a,b) => a.action === "examine" ? 1 : 0);

			const examineOptions = this.menuOptions.filter(e => e.action === "examine");
			if (examineOptions.length) {
				this.menuOptions = this.menuOptions.filter(e => e.action !== "examine");
				this.menuOptions.push(...examineOptions);
			}

			// this one always goes at the bottom; it's basically useless
			this.menuOptions.push({label: "cancel", action: "cancel"});

	    	var longestOption = 0;
	    	for (var i in this.menuOptions) {
	    		if (this.menuOptions[i].label.length > longestOption)
	    			longestOption = this.menuOptions[i].label.length;
			}
			
	    	this.rect.width = longestOption * this.characterWidth + 10;
	    	this.rect.height = this.menuOptions.length * this.menuOptionHeight;

    		this.active = true;
	    	this.rect.left = (x - xview) * Game.scale;
	    	if (this.rect.left + this.rect.width > Game.boundingRect.right)
	    		this.rect.left = Game.boundingRect.right - this.rect.width - this.toleranceMargin;

	    	this.rect.top = (y - yview) * Game.scale;
	    	if (this.rect.top + this.rect.height > Game.boundingRect.bottom)
	    		this.rect.top = Math.max(Game.boundingRect.bottom - this.rect.height - this.toleranceMargin, 0);
    	},
    	hide: function() {
    		this.active = false;
    		this.menuOptions = [];
    	},
    	getSelectedOption: function() {
    		var selectedOption = ~~((Game.mousePos.y - this.rect.top) / this.menuOptionHeight);
	    	if (selectedOption >= this.menuOptions.length)
	    		selectedOption = this.menuOptions.length - 1;
	    	return selectedOption;
    	},
    	getSelectedAction: function() {
    		return this.menuOptions[this.getSelectedOption()];
    	},
    	push: function(obj) {

    		/*
    		an array of context option objects.
    		for example:
			{
				action: "trade",
				objectId: [otherPlayer.id],
				objectName: [otherPlayer.name]
			}
    		*/

    		for (var i in obj) {
    			if (!obj[i].label) 
	    			obj[i].label = "{0} {1}".format(obj[i].action, obj[i].objectName || "");

				obj[i].id = Game.currentPlayer.id;
				// if (!obj[i].priority)
				// 	obj[i].priority = this.getPriorityByAction(obj[i].action);
	    		this.menuOptions.push(obj[i]);
			}
    	},
        handleMenuSelect: function() {
        	// send action based on context menu selection
			var menuItem = Game.ContextMenu.getSelectedAction();
			// menuItem.originalPos = this.originalPos;
			if (menuItem.action === "cancel") {
				// do nothing
            } else if (menuItem.action === "use" && !Game.currentPlayer.inventory.slotInUse) {
				menuItem.originalPos = this.originalPos;
			} else if (menuItem.callback) {
				menuItem.callback();
			} else {
                Game.ws.send(menuItem);
			}
			
			return menuItem;
		},
		loadContextOptions: function(obj) {
			this.contextOptions = new Map(Object.entries(obj));
		},
		// getPriorityByAction: function(action) {
		// 	for (var i = 0; i < this.contextOptions.length; ++i) {
		// 		if (this.contextOptions[i].name === action) {
		// 			return this.contextOptions[i].priority;
		// 		}
		// 	}
		// 	return 0;
		// },
		getContextOptionById: function(id, type) {
			if (this.contextOptions.has(type)) {
				for (var i = 0; i < this.contextOptions.get(type).length; ++i) {
					if (this.contextOptions.get(type)[i].id === id)
						return this.contextOptions.get(type)[i];
				}
			}
			return null;
		},
		setLeftclick: function(currentMousePos, obj) {
			this.leftclickPos = currentMousePos;
			this.leftclickMenuOption = obj;
		},
		getFillStyleFromCombatLevelDifference: function(playerCmb, enemyCmb) {
			let difference = playerCmb - enemyCmb;
			if (Math.abs(difference) < 10) {
				if (difference > 0) {
					return `rgb(${255 - (difference * 15)}, 255, 0)`
				} else if (difference < 0) {
					return `rgb(255, ${255 + (difference * 15)}, 0)`;
				} else {
					return "rgb(255, 255, 0)";
				}
			} else if (playerCmb > enemyCmb) {
				return "#0f0";
			} else {
				return "#f22";
			}
		}
    };
    
    Game.ContextMenu = new ContextMenu();
})();