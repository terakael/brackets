class InventorySlot {
	constructor(x, y, w, h, id) {
		this.rect = new Rectangle(x, y, w, h);
		this.fillColor = "#222";
		this.selectedColor = "#444";
		this.selected = false;
		this.id = id;
		this.equipped = false;
		this.count = 1;
		this.charges = 0;
	}

	draw(context, xview, yview) {
		context.fillStyle = this.selected ? this.selectedColor : this.fillColor;
		context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

		const skulled = false; // TODO

		let slotsToProtect = skulled ? 0 : 3;
		if (Game.HUD.activePrayers.includes(6))
			++slotsToProtect;
		else if (Game.HUD.activePrayers.includes(18))
			slotsToProtect += 2;
		// first three slots are protected on death, so they get a special outline
		if (this.id < slotsToProtect) {
			context.save();
			context.fillStyle = "rgba(150, 150, 0, 0.2)";
			context.fillRect(~~this.rect.left + 0.5, ~~this.rect.top + 0.5, this.rect.width, this.rect.height);
			context.restore();
		}
		
		if (this.item) {
			if (this.equipped) {
				context.fillStyle = "rgba(250, 0, 0, 0.2)";
				context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
			}
			this.item.draw(context, this.rect.left + (this.rect.width/2), this.rect.top + (this.rect.height/2));

			context.textAlign = "right";
			context.font = "10pt customFont";
			if (this.item.isStackable()) {
				context.textBaseline = "top";
				context.fillStyle = countToFriendlyColor(this.count);
				context.fillText(countToFriendly(this.count), this.rect.left + this.rect.width - 5, this.rect.top + 5);
			} else if (this.item.isCharged()) {
				context.textBaseline = "bottom";
				context.fillStyle = "red";
				context.fillText(this.charges, this.rect.left + this.rect.width - 5, this.rect.bottom - 5);
			}				
		}
	}
}

class Inventory {
	constructor(rect) {
		this.slotCount = 20;
		this.slotSize = 46;
		this.columns = 5;
		this.rect = new Rectangle(rect.left + 9, 250, this.slotSize * this.columns + 2, ~~(this.slotCount / this.columns) * this.slotSize + 2);

		this.mousePosOnClick = {x: 0, y: 0};
		this.selectedSlot = null;// the slot held by the mouse when dragging
		this.dragging = false;// dragging an item
		this.slotInUse = null;// the slot that the user clicked to use
		this.mouseDown = false;

		this.slots = [];
		for (let i = 0; i < this.slotCount; ++i) {
			this.slots.push(new InventorySlot(rect.left + 11 + (i % this.columns) * this.slotSize, this.rect.top + 2 + (~~(i/this.columns) * this.slotSize), this.slotSize - 2, this.slotSize - 2, i));
		}
	}

	draw(context, xview, yview) {
		context.save();
		context.setTransform(1, 0, 0, 1, 0, 0);

		context.fillStyle = "#666";
		context.textAlign = "left";
		context.font = "15px customFont";
		context.fillText("Inventory", xview + 10, yview + 10);
		context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

		for (var i in this.slots) {
			this.slots[i].draw(context, xview, yview);

			if (this.slots[i].rect.pointWithin(Game.mousePos) && this.slots[i].item.id != 0) {
				if (Game.activeUiWindow) {
					Game.ContextMenu.setLeftclick(Game.mousePos, this.getLeftclickOption(this.slots[i], Game.activeUiWindow.type));
				} else if (!this.slotInUse) {// if the slot is not in use then show the left-click hover option (or shift-click option if shift is pressed and it's nonzero)
					const relevantHoverOption = (Game.shiftPressed && this.slots[i].item.shiftclickOption) 
						? this.slots[i].item.shiftclickOption 
						: this.slots[i].item.leftclickOption;
					const contextOpt = Game.ContextMenu.getContextOptionById(relevantHoverOption, "item");

					Game.ContextMenu.setLeftclick(Game.mousePos, {
						id: Game.currentPlayer.id,
						action: contextOpt.name,
						slot: this.slots[i].id,
						objectId: this.slots[i].item.id,
						objectName: this.slots[i].item.name,
						type: "item",
						tileId: xyToTileId(~~Game.currentPlayer.x, ~~Game.currentPlayer.y)
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
	}

	process(dt) {
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
			this.slots[this.selectedSlot.id].item = SpriteManager.getItemById(0);
			this.slots[this.selectedSlot.id].equipped = false;
		}
	}

	getUseContextMenuOption(srcItem, descItem) {
		return {
			id: Game.currentPlayer.id,
			action: "use",
			src: srcItem.id,
			dest: descItem.id,
			type: "item",
			label: "use {0} -> {1}".format(srcItem.name, descItem.name)
		};
	}

	getLeftclickOption(slot, state) {
		if (!slot || !slot.item)
			return {};
		
		switch (state) {
			case "shop":
				return {
					id: Game.currentPlayer.id,
					action: "value",
					slot: slot.id,
					objectId: slot.item.id,
					objectName: slot.item.name,
					type: "item",
					valueTypeId: 1 // sell-value
				};

			case "trade":
				return {
					action: "offer",
					objectId: slot.item.id,
					objectName: slot.item.name,
					amount: 1,
					label: `offer 1 ${slot.item.name}`,
					slot: slot.id
				}

			case "bank":
			case "storage":
				return {
					action: "deposit",
					objectId: slot.item.id,
					objectName: slot.item.name,
					amount: 1,
					label: `deposit 1 ${slot.item.name}`,
					slot: slot.id,
					tileId: Game.activeUiWindow.tileId
				}

			default:
				break;
		}
	}

	getContextMenuOptions(slot, state) {
		let options = [];
		options.push(this.getLeftclickOption(slot, state));

		switch (state) {
			case "shop": {
				let sellAmounts = [1, 5, 10, 50];
				for (let i = 0; i < sellAmounts.length; ++i) {
					options.push({
						action: "sell",
						objectId: slot.item.id,
						objectName: slot.item.name,
						amount: sellAmounts[i],
						label: `sell ${sellAmounts[i]} ${slot.item.name}`,
					});
				}
				break;
			}
			case "trade": {
				let offerAmounts = [5, 10, "X", -1];
				for (let i = 0; i < offerAmounts.length; ++i) {
					if (offerAmounts[i] === "X") {
						// offer x
						options.push({
							label: `offer X ${slot.item.name}`,
							callback: () => {
								ChatBox.requireInput("offer amount", /[0-9km]/).then(amount => {
									const intAmount = friendlyToCount(amount);
									if (intAmount > 0) {
										Game.ws.send({
											action: "offer",
											objectId: slot.item.id,
											amount: intAmount,
										});
									}
								});
							}
						});
						continue;
					}

					options.push({
						action: "offer",
						objectId: slot.item.id,
						amount: offerAmounts[i],
						label: `offer ${offerAmounts[i] == -1 ? "all" : offerAmounts[i]} ${slot.item.name}`,
					});
				}

				

				break;
			}
			case "bank": 
			case "storage": {
				let offerAmounts = [5, 10, "X", -1];
				for (let i = 0; i < offerAmounts.length; ++i) {
					if (offerAmounts[i] === "X") {
						// deposit x
						options.push({
							label: `deposit X ${slot.item.name}`,
							callback: () => {
								ChatBox.requireInput("deposit amount", /[0-9km]/).then(amount => {
									const intAmount = friendlyToCount(amount);
									if (intAmount > 0) {
										Game.ws.send({
											action: "deposit",
											amount: intAmount,
											slot: slot.id,
											tileId: Game.activeUiWindow.tileId
										});
									}
								});
							}
						});
						continue;
					}

					options.push({
						action: "deposit",
						amount: offerAmounts[i],
						label: `deposit ${offerAmounts[i] == -1 ? "all" : offerAmounts[i]} ${slot.item.name}`,
						slot: slot.id,
						tileId: Game.activeUiWindow.tileId
					});
				}
				break;
			}
			default:
				break;
		}

		return options;
	}

	loadContextMenuOptions(slot) {
		// slot.item has a contextOptions int.  parse that to retrieve the correct actions
		var options = []

		if (Game.activeUiWindow) {
			options = options.concat(this.getContextMenuOptions(slot, Game.activeUiWindow.type));
		}
		else if (this.slotInUse) {
			options.push(this.getUseContextMenuOption(this.slotInUse.item, slot.item));
		} 
		else {
			var contextOption = Game.ContextMenu.getContextOptionById(slot.item.leftclickOption, "item");
			if (contextOption) {
				options.push({
					action: contextOption.name, 
					slot: slot.id, 
					objectId: slot.item.id, 
					objectName: slot.item.name, 
					type: "item",
					tileId: xyToTileId(~~Game.currentPlayer.x, ~~Game.currentPlayer.y)
				});
			}

			const itemContextOptions = Game.ContextMenu.contextOptions.get("item");
			for (var i = 0; i < itemContextOptions.length; ++i) {
				var contextOption = itemContextOptions[i];
				if (slot.item.otherOptions & contextOption.id)
					options.push({
						action: contextOption.name, 
						slot: slot.id, 
						objectId: slot.item.id, 
						objectName: slot.item.name, 
						type: "item",
						tileId: xyToTileId(~~Game.currentPlayer.x, ~~Game.currentPlayer.y)
					});
			}

			Game.ContextMenu.push([{ 
				action: "examine", 
				objectName: slot.item.name, 
				objectId: slot.item.id, 
				type: "item"
			}]);
		}

		if (options.length > 0)
			Game.ContextMenu.push(options);
	}

	onMouseDown(button) {
		switch (button) {
			case 0:// left
				if (Game.ContextMenu.active) {
					// handle context menu click
					this.selectedMenuItem = true;
					let menuItem = Game.ContextMenu.handleMenuSelect();
					if (menuItem.action === "use")
						this.handleSlotAction(menuItem.action, menuItem.originalPos);
					Game.ContextMenu.hide();
					break;
				}
				else if (Game.activeUiWindow) {
					let slot = this.getMouseOverSlot(Game.mousePos);
					if (slot && slot.item)
						Game.ws.send(this.getLeftclickOption(slot, Game.activeUiWindow.type));
					break;
				}

				this.mouseDown = true;
				if (this.dragging) {// if you drag out of the window then this can happen as the up event isn't hit
					this.slots[this.selectedSlot.id].item = this.selectedSlot.item;
					this.slots[this.selectedSlot.id].equipped = this.selectedSlot.equipped;
					this.selectedSlot = null;
					this.dragging = false;
				}
				this.mousePosOnClick = Game.mousePos;
				let slot = this.getMouseOverSlot(Game.mousePos);
				if (slot.item.id != 0) {
					this.selectedSlot = {id: slot.id, item: slot.item, equipped: slot.equipped, count: slot.count, charges: slot.charges};
				}

				break;
			case 2:// right
				if (!Game.ContextMenu.active) {
					let slot = this.getMouseOverSlot(Game.mousePos);
					if (slot && slot.item) {
						this.loadContextMenuOptions(slot);
					}
				}
				break;
		}
	}

	onMouseUp(button) {
		// we just selected something from the context menu so ignore the mouse-up
		if (this.selectedMenuItem) {
			this.selectedMenuItem = false;
			return;
		}

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
	}

	handleInvMove() {
		var slot = this.getMouseOverSlot(Game.mousePos);
		if (slot) {
			if (slot.item) {
				this.slots[this.selectedSlot.id].item = slot.item;
				this.slots[this.selectedSlot.id].equipped = slot.equipped;
				this.slots[this.selectedSlot.id].count = slot.count;
				this.slots[this.selectedSlot.id].charges = slot.charges;
			}
			slot.item = this.selectedSlot.item;
			slot.equipped = this.selectedSlot.equipped;
			slot.count = this.selectedSlot.count;
			slot.charges = this.selectedSlot.charges;
		} else {
			this.slots[this.selectedSlot.id].item = this.selectedSlot.item;
			this.slots[this.selectedSlot.id].equipped = this.selectedSlot.equipped;
			this.slots[this.selectedSlot.id].count = this.selectedSlot.count;
			this.slots[this.selectedSlot.id].charges = this.selectedSlot.charges;
		}

		if (slot) {// if the mouse isnt' over a slot then the item won't move, so don't send a move request.
			Game.ws.send({
				action: "invmove",
				id: Game.currentPlayer.id,
				src: this.selectedSlot.id,
				dest: slot.id
			});
		}
	}

	getMouseOverSlot(pos) {
		for (var i in this.slots) {
			if (this.slots[i].rect.pointWithin(pos))
				return this.slots[i];
		}
	}

	updateInventory(inv) {
		for (let i in this.slots) {
			let invItem = inv[i];
			this.slots[i].item = SpriteManager.getItemById(invItem.itemId);
			this.slots[i].count = invItem.count;
			this.slots[i].charges = invItem.charges;
		}
	}

	setEquippedSlots(equippedArray) {
		for (var i in this.slots) {
			this.slots[i].equipped = equippedArray.includes(Number(i));
		}
	}

	handleSlotAction(action, pos) {
		var slot = this.getMouseOverSlot(pos);

		if (action === "use" && this.slotInUse == null) {
			if (slot.item.id != 0)
				this.slotInUse = slot;
		} else {
			if (this.slotInUse != slot) {
				let request = Game.ContextMenu.leftclickMenuOption;
				request.slot = slot.id;
				if (this.slotInUse != null)
					request.srcSlot = this.slotInUse.id;
				Game.ws.send(request);
			}
			this.slotInUse = null;
		}
	}

	mouseWithin() {
		return this.rect.pointWithin(Game.mousePos) || (Game.ContextMenu.active && this.rect.pointWithin(Game.ContextMenu.originalPos));
	}

	onResize(newLeft) {
		this.rect.set(newLeft + 9, this.rect.top, this.rect.width, this.rect.height);

		for (var i = 0; i < this.slotCount; ++i) {
			this.slots[i].rect.set(newLeft + 11 + (i % this.columns) * this.slotSize, this.rect.top + 2 + (~~(i/this.columns) * this.slotSize), this.slotSize - 2, this.slotSize - 2, i);
		}
	}
}