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
		this.selectedSlot = null;// the slot held by the mouse when dragging
		this.dragging = false;// dragging an item
		this.slotInUse = null;// the slot that the user clicked to use
		this.mouseDown = false;

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

				if (this.slots[i].rect.pointWithin(Game.mousePos) && this.slots[i].item.id != 0) {
					if (!this.slotInUse) {// if the slot is not in use then show the left-click hover option
						var contextOpt = Game.ContextMenu.getContextOptionById(this.slots[i].item.leftclickOption);

						Game.ContextMenu.setLeftclick(Game.mousePos, {
							id: Game.currentPlayer.id,
							action: contextOpt.name,
							slot: this.slots[i].id,
							objectId: this.slots[i].item.id,
							objectName: this.slots[i].item.name,
							type: "item"
						});
					} else {
						if (this.slotInUse !== this.slots[i]) {
							// if there's a slot in use, then show the "use item1 -> item2" text
							Game.ContextMenu.setLeftclick(Game.mousePos, this.getUseContextMenuOption(this.slotInUse.item, this.slots[i].item));
						}
					}
				}
			}

			if (this.dragging && this.selectedSlot) {
				this.selectedSlot.item.draw(context, Game.mousePos.x, Game.mousePos.y);
			}

			if (this.slotInUse) {
				context.strokeStyle = "white";
				context.strokeRect(this.slotInUse.rect.left, this.slotInUse.rect.top, this.slotInUse.rect.width, this.slotInUse.rect.height);
			}

			context.restore();
		},
		process: function(dt) {
			if (Game.ContextMenu.active)
				return;

			for (var i in this.slots) {
				this.slots[i].selected = this.slots[i].rect.pointWithin(Game.mousePos);
			}

			if (!this.dragging && this.selectedSlot && this.mouseDown &&
				(Math.abs(this.mousePosOnClick.x - Game.mousePos.x) > 5 ||
				Math.abs(this.mousePosOnClick.y - Game.mousePos.y) > 5)) {
				// onclick event
				this.dragging = true;
				this.slotInUse = null;
				this.slots[this.selectedSlot.id].item = Game.SpriteManager.getItemById(0);
				this.slots[this.selectedSlot.id].equipped = false;
			}
		},
		getUseContextMenuOption: function(srcItem, descItem) {
			return {
				id: Game.currentPlayer.id,
				action: "use",
				src: srcItem.id,
				dest: descItem.id,
				type: "item",
				label: "use {0} -> {1}".format(srcItem.name, descItem.name)
			};
		},
		loadContextMenuOptions: function(slot) {
			// slot.item has a contextOptions int.  parse that to retrieve the correct actions
			var options = []

			if (this.slotInUse) {
				options.push(this.getUseContextMenuOption(this.slotInUse.item, slot.item));
			} else {
				var contextOption = Game.ContextMenu.getContextOptionById(slot.item.leftclickOption);
				options.push({
					action: contextOption.name, 
					slot: slot.id, 
					objectId: slot.item.id, 
					objectName: slot.item.name, 
					type: "item", 
					priority: contextOption.priority
				});

				for (var i = 0; i < Game.ContextMenu.contextOptions.length; ++i) {
					var contextOption = Game.ContextMenu.contextOptions[i];
					if (slot.item.otherOptions & contextOption.id)
						options.push({
							action: contextOption.name, 
							slot: slot.id, 
							objectId: slot.item.id, 
							objectName: slot.item.name, 
							type: "item", 
							priority: contextOption.priority
						});
				}
			}

			if (options.length > 0)
				Game.ContextMenu.push(options);

			// Game.ContextMenu.addOptionsByInventorySlot(slot);
		},
		onMouseDown: function(button) {
			if (Game.ContextMenu.active)
				return;

			switch (button) {
				case 0:// left
					this.mouseDown = true;
					if (this.dragging) {// if you drag out of the window then this can happen as the up event isn't hit
						this.slots[this.selectedSlot.id].item = this.selectedSlot.item;
						this.slots[this.selectedSlot.id].equipped = this.selectedSlot.equipped;
						this.selectedSlot = null;
						this.dragging = false;
					}
					this.mousePosOnClick = Game.mousePos;
					var slot = this.getMouseOverSlot(Game.mousePos);
					if (slot.item.id != 0) {
						this.selectedSlot = {id: slot.id, item: slot.item, equipped: slot.equipped};
					}

					break;
				case 2:// right
					var slot = this.getMouseOverSlot(Game.mousePos);
					if (slot && slot.item) {
						this.loadContextMenuOptions(slot);
					}
					break;
			}
		},
		onMouseUp: function(button) {
			if (Game.ContextMenu.active)
				return;

			switch (button) {
				case 0:// left
					this.mouseDown = false;
					if (this.dragging) {
						if (this.selectedSlot){
							this.handleInvMove();
							this.selectedSlot = null;
						}

						this.dragging = false;
						return;
					}

					if (Game.ContextMenu.leftclickMenuOption) {
						this.handleSlotAction(Game.ContextMenu.leftclickMenuOption.action, Game.mousePos);
						return;
					} else {
						if (this.slotInUse)
							this.slotInUse = null;
					}

					// in all mouseup cases we want to reset the dragging and selectedSlot data
					this.selectedSlot = null;
					this.dragging = false;
					break;
			}
		},
		handleInvMove: function() {
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
				this.slots[i].item = Game.SpriteManager.getItemById(invArray[i]);
			}
		},
		setEquippedSlots: function(equippedArray) {
			for (var i in this.slots) {
				this.slots[i].equipped = equippedArray.includes(Number(i));
			}
		},
		handleSlotAction: function(action, pos) {
			var slot = this.getMouseOverSlot(pos);

			if (action === "use" && this.slotInUse == null) {
				if (slot.item.id != 0)
					this.slotInUse = slot;
			} else {
				if (this.slotInUse != slot)
					Game.ws.send(Game.ContextMenu.leftclickMenuOption);
				this.slotInUse = null;
			}
		}
	};
	
	Game.Inventory = Inventory;
})();