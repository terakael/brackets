(function() {
	function InventorySlot(x, y, w, h, id) {
		this.rect = new Game.Rectangle(x, y, w, h);
		this.fillColor = "#222";
		this.selectedColor = "#444";
		this.selected = false;
		this.id = id;
		this.equipped = false;
	};
	InventorySlot.prototype = {
		constructor: InventorySlot,
		draw: function(context, xview, yview) {
			context.fillStyle = this.selected ? this.selectedColor : this.fillColor;
			context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
			if (this.item) {
				if (this.equipped) {
					context.fillStyle = "#800";
					context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
				}
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
		this.selectedSlot = null;
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
			context.textAlign = "left";
			context.font = "15px Consolas";
			context.fillText("Inventory", xview + 10, yview + 10);
			context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

			for (var i in this.slots) {
				this.slots[i].draw(context, xview, yview);
			}

			if (this.dragging && this.selectedSlot) {
				this.selectedSlot.item.draw(context, Game.mousePos.x, Game.mousePos.y);
			}

			context.restore();
		},
		process: function(dt) {
			if (Game.ContextMenu.active)
				return;

			for (var i in this.slots) {
				this.slots[i].selected = this.slots[i].rect.pointWithin(Game.mousePos);
			}

			if (!this.dragging && this.selectedSlot && 
				(Math.abs(this.mousePosOnClick.x - Game.mousePos.x) > 5 ||
				Math.abs(this.mousePosOnClick.y - Game.mousePos.y) > 5)) {
				// onclick event
				this.dragging = true;
				this.slots[this.selectedSlot.id].item = null;
				this.slots[this.selectedSlot.id].equipped = false;
			}
		},
		onMouseDown: function(button) {
			switch (button) {
				case 0:// left
					if (Game.ContextMenu.active) {
						Game.ContextMenu.handleMenuSelect();
						return;
					}

					if (this.dragging) {// if you drag out of the window then this can happen as the up event isn't hit
						this.slots[this.selectedSlot.id].item = this.selectedSlot.item;
						this.slots[this.selectedSlot.id].equipped = this.selectedSlot.equipped;
						this.selectedSlot = null;
						this.dragging = false;
					}
					this.mousePosOnClick = Game.mousePos;
					var slot = this.getMouseOverSlot(Game.mousePos);
					if (slot.item) {
						this.selectedSlot = {id: slot.id, item: slot.item, equipped: slot.equipped};
					}
					break;
				case 2:// right
					if (!Game.ContextMenu.active) {
						var slot = this.getMouseOverSlot(Game.mousePos);
						if (slot && slot.item) {
							Game.ContextMenu.addOptionsByInventorySlot(slot);
						}
					}
					break;
			}
		},
		onMouseUp: function(button) {
			if (Game.ContextMenu.active)
				return;

			switch (button) {
				case 0:// left
					if (this.dragging && this.selectedSlot) {
						var slot = this.getMouseOverSlot(Game.mousePos);
						if (slot) {
							if (slot.item) {
								this.slots[this.selectedSlot.id].item = slot.item;
								this.slots[this.selectedSlot.id].equipped = slot.equipped;
							}
							slot.item = this.selectedSlot.item;
							slot.equipped = this.selectedSlot.equipped;
						} else {
							this.slots[this.selectedSlot.id].item = this.selectedSlot.item;
							this.slots[this.selectedSlot.id].equipped = this.selectedSlot.equipped;
						}

						if (slot) {// if the mouse isnt' over a slot then the item won't move, so don't send a move request.
							Game.ws.send({
								action: "invmove",
								id: Game.getPlayer().id,
								src: this.selectedSlot.id,
								dest: slot.id
							});
						}
					} else {
						// not dragging an item - we wanna do the first context menu option
						var slot = this.getMouseOverSlot(Game.mousePos);
						if (slot && slot.item) {
							Game.ContextMenu.addOptionsByInventorySlot(slot);
							Game.ContextMenu.executeFirstOption();
							Game.ContextMenu.hide();
						}
					}

					// in all mouseup cases we want to reset the dragging and selectedSlot data
					this.selectedSlot = null;
					this.dragging = false;
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
		},
		setEquippedSlots: function(equippedArray) {
			for (var i in this.slots) {
				this.slots[i].equipped = equippedArray.includes(Number(i));
			}
		}
	};
	
	Game.Inventory = Inventory;
})();