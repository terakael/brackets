(function() {
	function InventorySlot(x, y, w, h, id) {
		this.rect = new Game.Rectangle(x, y, w, h);
		this.fillColor = "#222";
		this.selectedColor = "#444";
		this.selected = false;
		this.id = id;

		// there will be an item instead of a sprite here.
		// for the list of actions, we will have a bit-packed int in the item database
		// eg:
		// 1 = use
		// 2 = drop
		// 4 = eat
		// 8 = equip
		// 16 = examine
		// etc.  The item will have a combination of these.
	};
	InventorySlot.prototype = {
		constructor: InventorySlot,
		draw: function(context, xview, yview) {
			context.fillStyle = this.selected ? this.selectedColor : this.fillColor;
			context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
			if (this.item) {
				this.item.draw(context, this.rect.left + (this.rect.width/2), this.rect.top + (this.rect.height/2));
			}
		}
	};

	function Inventory() {
		this.slotCount = 20;
		this.slotSize = 46;
		this.columns = 5;
		this.rect = new Game.Rectangle(Game.hudCameraRect.left + 9, 270, this.slotSize * this.columns + 2, ~~(this.slotCount / this.columns) * this.slotSize + 2);

		this.mousePosOnClick = {x: 0, y: 0};
		this.selectedItem = null;
		this.selectedSlotId = 0;
		this.dragging = false;// dragging an item

		this.slots = [];
		for (var i = 0; i < this.slotCount; ++i) {
			this.slots.push(new InventorySlot(Game.hudCameraRect.left + 11 + (i % this.columns) * this.slotSize, this.rect.top + 2 + (~~(i/this.columns) * this.slotSize), this.slotSize - 2, this.slotSize - 2, i));
		}
	};
	Inventory.prototype = {
		constructor: Inventory,
		draw: function(context, xview, yview) {
			context.save();
			context.setTransform(1, 0, 0, 1, 0, 0);

			context.fillStyle = "#666";
			context.fillText("Inventory", xview + 10, yview + 10);
			context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

			for (var i in this.slots) {
				this.slots[i].draw(context, xview, yview);
			}

			if (this.dragging && this.selectedItem) {
				this.selectedItem.draw(context, Game.mousePos.x, Game.mousePos.y);
			}

			context.restore();
		},
		process: function(dt) {
			if (Game.ContextMenu.active)
				return;

			for (var i in this.slots) {
				this.slots[i].selected = this.slots[i].rect.pointWithin(Game.mousePos);
			}

			if (!this.dragging && this.selectedItem && 
				(Math.abs(this.mousePosOnClick.x - Game.mousePos.x) > 5 ||
				Math.abs(this.mousePosOnClick.y - Game.mousePos.y) > 5)) {
				// onclick event
				this.dragging = true;
				this.slots[this.selectedSlotId].item = null;
			}
		},
		onMouseDown: function(button) {
			if (Game.ContextMenu.active)
				return;

			switch (button) {
				case 0:// left
					if (this.dragging) {// if you drag out of the window then this can happen as the up event isn't hit
						this.slots[this.selectedSlotId].item = this.selectedItem;
						this.selectedItem = null;
						this.dragging = false;
					}
					this.mousePosOnClick = Game.mousePos;
					var slot = this.getMouseOverSlot(Game.mousePos);
					if (slot.item) {
						this.selectedItem = slot.item;
						this.selectedSlotId = slot.id;
					}
					break;
				case 2:// right
					var slot = this.getMouseOverSlot(Game.mousePos);
					if (slot && slot.item) {
						Game.ContextMenu.addOptionsByItem(slot.item);
					}
					break;
			}
		},
		onMouseUp: function(button) {
			if (Game.ContextMenu.active)
				return;

			switch (button) {
				case 0:// left
					if (this.selectedItem) {
						var slot = this.getMouseOverSlot(Game.mousePos);
						if (slot) {
							if (slot.item)
								this.slots[this.selectedSlotId].item = slot.item;
							slot.item = this.selectedItem;
						} else {
							this.slots[this.selectedSlotId].item = this.selectedItem;
						}

						if (slot) {// if the mouse isnt' over a slot then the item won't move, so don't send a move request.
							Game.ws.send({
								action: "invmove",
								id: Game.getPlayer().id,
								src: this.selectedSlotId,
								dest: slot.id
							});
						}

						this.selectedItem = null;
						this.dragging = false;
					}
					break;
			}
		},
		getMouseOverSlot: function(pos) {
			for (var i in this.slots) {
				if (this.slots[i].rect.pointWithin(pos))
					return this.slots[i];
			}
		},
		loadInventory: function(invArray) {
			for (var i in this.slots) {
				this.slots[i].item = Game.SpriteManager.getItemById(invArray[i] || 0);
			}
		},
		updateInventory: function(invArray) {
			for (var i in invArray) {
				if (this.slots[i].item.id !== invArray[i]) {
					// mismatching slot between client and server; update to what server has
					this.slots[i].item = Game.SpriteManager.getItemById(invArray[i]);
				}
			}
		}
	};
	
	Game.Inventory = Inventory;
})();