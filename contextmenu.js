// a unit is an abstract superclass for npcs and players
// a unit has an inventory and stats, as well as a sprite with the following animations:
// walkup, walkdown, walkleft, walkright, fight, idle

(function() {
    function ContextMenu() {
    }

    ContextMenu.prototype = {
    	constructor: ContextMenu,
    	rect: new Game.Rectangle(0, 0, 0, 0),
    	toleranceMargin: 10,
    	active: false,
    	menuOptions: [],
    	menuOptionHeight: 20,
    	draw: function(ctx) {
    		if (!this.active)
	    		return;

	    	ctx.save();
	    	ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
	    	ctx.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

	    	var selectedOption = this.getSelectedOption();

	    	ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
	    	ctx.fillRect(this.rect.left, this.rect.top + (this.menuOptionHeight * selectedOption), this.rect.width, this.menuOptionHeight);

	    	ctx.strokeStyle = "red";
	    	ctx.strokeRect(this.rect.left + 0.5, this.rect.top + 0.5, this.rect.width, this.rect.height);

	    	for (var i = 0; i < this.menuOptions.length; ++i) {
	    		ctx.fillStyle = i === selectedOption ? "yellow" : "white";
	    		ctx.fillText(this.menuOptions[i].label, this.rect.left + 10, this.rect.top + (this.menuOptionHeight * (i+1)) - 5);
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

    		this.menuOptions.push({label: "walk here", id: Game.getPlayer().id, action: "move", x: x, y: y});
    		this.menuOptions.push({label: "cancel", action: "cancel"});

	    	var longestOption = 0;
	    	for (var i in this.menuOptions) {
	    		if (this.menuOptions[i].label.length > longestOption)
	    			longestOption = this.menuOptions[i].label.length;
	    	}

	    	this.rect.width = longestOption * 9 + 10;
	    	this.rect.height = this.menuOptions.length * this.menuOptionHeight;

    		this.active = true;
	    	this.rect.left = (x - xview) * Game.scale;
	    	if (this.rect.left + this.rect.width > Game.boundingRect.right)
	    		this.rect.left = Game.boundingRect.right - this.rect.width - this.toleranceMargin;

	    	this.rect.top = (y - yview) * Game.scale;
	    	if (this.rect.top + this.rect.height > Game.boundingRect.bottom)
	    		this.rect.top = Game.boundingRect.bottom - this.rect.height - this.toleranceMargin;
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

    			obj[i].id = Game.getPlayer().id;
	    		this.menuOptions.push(obj[i]);
    		}

    		
    	}
    };
    
    Game.ContextMenu = new ContextMenu();
})();