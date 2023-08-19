class StorageSlot {
	static size = 46; // 46x46 square
	
	constructor(id) {
		this.fillColor = "#222";
		this.hoverColor = "#444";
		this.hover = false;
		this.id = id;
		this.count = 1;
		this.charges = 0;
	}

	draw(context) {
		context.fillStyle = this.hover ? this.hoverColor : this.fillColor;
		context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

		context.strokeStyle = "#444";
		context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

		if (this.item) {
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

	setRect(x, y, w, h) {
		this.rect = new Rectangle(x, y, w, h);
	}
}

class Storage {
	constructor(rect, name, tileId, itemList, type) {
		this.type = type; // used for other things to know what is open
		this.name = name;
		this.tileId = tileId;
		this.columns = Math.ceil(Math.sqrt(itemList.length));

		// if we can get a clean amount of rows then use that
		for (let i = this.columns; i >= 1; --i) {
			if (itemList.length % i == 0) {
				this.columns = i;
				break;
			}
		}
		this.rect = rect;

		this.mousePosOnClick = {x: 0, y: 0};
		this.selectedSlot = null;// the slot held by the mouse when dragging
		this.dragging = false;// dragging an item
		this.slotInUse = null;// the slot that the user clicked to use
		this.mouseDown = false;

		this.slots = [];
		for (let i = 0; i < itemList.length; ++i) {
			this.slots.push(new StorageSlot(i));
		}

		this.updateStock(itemList);
		this.onResize(rect);
	}

	draw(context) {
		context.save();
		context.setTransform(1, 0, 0, 1, 0, 0);

		context.strokeStyle = "red";
		context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

		context.fillStyle = "#000";
		context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

		context.textBaseline = "middle";
		context.textAlign = "center";
		context.fillStyle = "white";
		context.font = "15px customFont";
		context.fillText(`- ${this.name} -`, this.rect.left + (this.rect.width / 2), this.rect.top + 15);

		this.slots.forEach(slot => slot.draw(context));

		if (this.dragging && this.selectedSlot) {
			this.selectedSlot.item.draw(context, Game.mousePos.x, Game.mousePos.y);
		}

		context.restore();
	}

	process(dt) {
		if (Game.ContextMenu.active)
			return;

		for (var i in this.slots) {
			this.slots[i].hover = this.slots[i].rect.pointWithin(Game.mousePos);
			if (this.slots[i].hover && this.slots[i].item.id !== 0) {
				Game.ContextMenu.setLeftclick(Game.mousePos, {
					action: "withdraw", 
					objectName: this.slots[i].item.name,
					objectId: this.slots[i].item.id,
					amount: 1,
					slot: i,
					label: `withdraw 1 ${this.slots[i].item.name}`,
					tileId: this.tileId
				});
			}
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

	onMouseDown(e) {
		if (!this.mouseWithin() && !Game.currentPlayer.inventory.mouseWithin()) {
			Game.ws.send({action: "close"});
			Game.activeUiWindow = null;
			return;
		}

		if (e.button === 0) {
			if (Game.ContextMenu.active) {
				// handle context menu click
				Game.ContextMenu.handleMenuSelect();
				Game.ContextMenu.hide();
				this.selectedMenuItem = true;
				return;
			}
		}

		if (Game.currentPlayer.inventory.mouseWithin()) {
			Game.currentPlayer.inventory.onMouseDown(e.button);
		} else if (this.mouseWithin()) {
			switch (e.button) {
				case 0:// left
					this.mouseDown = true;
					if (this.dragging) {// if you drag out of the window then this can happen as the up event isn't hit
						this.slots[this.selectedSlot.id].item = this.selectedSlot.item;
						this.slots[this.selectedSlot.id].equipped = this.selectedSlot.equipped;
						this.selectedSlot = null;
						this.dragging = false;
					}
					this.mousePosOnClick = Game.mousePos;
					this.selectedSlot = {...this.getMouseOverSlot(Game.mousePos)};

					break;
				case 2:// right
					if (!Game.ContextMenu.active) {
						let slot = this.getMouseOverSlot(Game.mousePos);

						if (slot.item.id) {
							let options = [];
							options.push(Game.ContextMenu.leftclickMenuOption);

							let offerAmounts = [5, 10, "X", -1];
							for (let i = 0; i < offerAmounts.length; ++i) {
								if (offerAmounts[i] === "X") {
									// withdraw x
									options.push({
										label: `withdraw X ${slot.item.name}`,
										callback: () => {
											ChatBox.requireInput("withdraw amount", /[0-9km]/).then(amount => {
												const intAmount = friendlyToCount(amount);
												if (intAmount > 0) {
													Game.ws.send({
														action: "withdraw",
														amount: intAmount,
														slot: slot.id,
														tileId: this.tileId
													});
												}
											});
										}
									});
									continue;
								}
				
								options.push({
									action: "withdraw",
									amount: offerAmounts[i],
									label: `withdraw ${offerAmounts[i] == -1 ? "all" : offerAmounts[i]} ${slot.item.name}`,
									slot: slot.id,
									tileId: this.tileId
								});
							}
							Game.ContextMenu.push(options);
						}
					}
					break;
			}
		}
	}

	onMouseUp(e) {
		// we just selected something from the context menu so ignore the mouse-up
		if (this.selectedMenuItem) {
			this.selectedMenuItem = false;
			return;
		}

		if (this.mouseWithin()) {
			switch (e.button) {
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
						Game.ws.send(Game.ContextMenu.leftclickMenuOption);
						return;
					}

					// in all mouseup cases we want to reset the dragging and selectedSlot data
					this.selectedSlot = null;
					this.dragging = false;
					break;
			}
		}
	}

	handleSlotAction(action, pos) {
		
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
				action: "storage_move",
				id: Game.currentPlayer.id,
				src: this.selectedSlot.id,
				dest: slot.id,
				tileId: this.tileId
			});
		}
	}

	getMouseOverSlot(pos) {
		for (var i in this.slots) {
			if (this.slots[i].rect.pointWithin(pos))
				return this.slots[i];
		}
	}

	updateStock(list) {
		for (let i in this.slots) {
			let invItem = list[i];
			this.slots[i].item = SpriteManager.getItemById(invItem.itemId);
			this.slots[i].count = invItem.count;
			this.slots[i].charges = invItem.charges;
		}
	}

	mouseWithin() {
		return this.rect.pointWithin(Game.mousePos) || (Game.ContextMenu.active && this.rect.pointWithin(Game.ContextMenu.originalPos));
	}

	onResize(worldRect) {
		// eight slots means four across, two down (with 10 pixels buffer each side)
		const maxRows = this.columns;
		const margin = 10;
		const header = 20; // top area for title header
		const uiWidth = (StorageSlot.size * maxRows) + (margin * 2);
		const uiHeight = (StorageSlot.size * Math.ceil(this.slots.length / maxRows)) + (margin * 2) + header;


        const uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;
        const uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;

        this.rect = new Rectangle(uix, uiy, uiWidth, uiHeight);

		for (let i = 0; i < this.slots.length; ++i) {
			let currentRow = ~~(i / maxRows);
            let currentColumn = i % maxRows;

			this.slots[i].setRect(this.rect.left + margin + (currentColumn * StorageSlot.size),
								  this.rect.top + margin + header + (currentRow * StorageSlot.size),
								  StorageSlot.size, StorageSlot.size);
		}
	}
}