(function() {
    var ButtonStates = {
        off: 0,
        hover: 1,
        click: 2,
        disabled: 3
    }

    function TradeSlot(itemId, currentStock, slot) {
        this.rect = new Rectangle(0, 0, 65, 65);
        this.item = SpriteManager.getItemById(itemId);
        this.currentStock = currentStock;
        this.slot = slot;

        if (this.item.id != 0) {
            this.leftclickOption = {
                id: Game.currentPlayer.id,
                action: "rescind", 
                objectId: this.item.id,
                amount: 1,
                slot: this.slot,
                label: `rescind 1 ${this.item.name}`
            }
        }

        this.fillStyle = "#000";
        this.hoverFillStyle = "#222";
        this.clickFillStyle = "#444";

        this.strokeStyle = "#a00";
        this.hoverStrokeStyle = "#f00";
        this.clickStrokeSTyle = "#f00";
    }

    TradeSlot.prototype.setLocalPosition = function(x, y) {
        this.rect.setPos(~~(this.rect.left + x) + 0.5, ~~(this.rect.top + y) + 0.5);
    }
    
    TradeSlot.prototype.draw = function(context) {
        if (this.item.id === 0)
             return;

        context.save();
        
        this.setFillStrokeStyle(context);
        context.lineWidth = 1;

        var buttonOffsetX = this.state === ButtonStates.click ? 2 : 0;
        var buttonOffsetY = this.state === ButtonStates.click ? 2 : 0;

        context.fillRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);

        context.textAlign = "right";
        context.textBaseline = "top";
        context.font = "10pt customFont";
        context.fillStyle = countToFriendlyColor(this.currentStock);

        // current stock
        if (this.currentStock > 1)
            context.fillText(countToFriendly(this.currentStock), this.rect.left + this.rect.width + buttonOffsetX - 5, this.rect.top + buttonOffsetY + 5);

        this.item.draw(context, this.rect.left + (this.rect.width/2), this.rect.top + (this.rect.height/2));

        context.restore();
    }

    TradeSlot.prototype.setFillStrokeStyle = function(context) {
        switch (this.state) {
            case ButtonStates.hover:
                context.fillStyle = this.hoverFillStyle;
                context.strokeStyle = this.hoverStrokeStyle;
                break;
            case ButtonStates.click:
                context.fillStyle = this.clickFillStyle;
                context.strokeStyle = this.strokeFillStyle;
                break;
            default:
                context.fillStyle = this.fillStyle;
                context.strokeStyle = this.strokeStyle;
                break;
        }
    }

    TradeSlot.prototype.process = function(dt) {
        if (this.state === ButtonStates.disabled)
            return;

        if(this.rect.pointWithin(Game.mousePos)) {
            if (this.state !== ButtonStates.click) 
                this.state = ButtonStates.hover;
            
            if (this.item.id != 0)
                Game.ContextMenu.setLeftclick(Game.mousePos, this.leftclickOption);
        } else {
            this.state = ButtonStates.off;
        }
    }

    TradeSlot.prototype.onMouseDown = function(e) {
        if (this.state === ButtonStates.disabled)
            return;

        switch (e.button) {
            case 0: // left
                if (this.rect.pointWithin(Game.mousePos)) {
                    this.state = ButtonStates.click;
                }
            break;

            case 2: // right:
                if (this.rect.pointWithin(Game.mousePos)) {
                    Game.ContextMenu.hide();// clear all the previous actions
                    if (this.item.id != 0) {
                        // context options
                        Game.ContextMenu.push([this.leftclickOption]);

                        let amounts = [5, 10, "X", -1];
                        for (let i = 0; i < amounts.length; ++i) {
                            if (amounts[i] === "X") {
                                Game.ContextMenu.push([{
                                    label: `rescind X ${this.item.name}`,
                                    callback: () => {
                                        ChatBox.requireInput("rescind amount", /[0-9km]/).then(amount => {
                                            const intAmount = friendlyToCount(amount);
                                            if (intAmount > 0) {
                                                Game.ws.send({
                                                    action: "rescind",
                                                    objectId: this.item.id,
                                                    slot: this.slot,
                                                    amount: intAmount
                                                });
                                            }
                                        });
                                    }
                                }]);
                                continue;
                            }
                            
                            Game.ContextMenu.push([{
                                action: "rescind",
                                objectId: this.item.id,
                                amount: amounts[i],
                                slot: this.slot,
                                label: `rescind ${amounts[i] == -1 ? "all" : amounts[i]} ${this.item.name}`
                            }]);
                        }
                    }
                }
            break;
        }
            
    
        
    }

    TradeSlot.prototype.onMouseUp = function(e) {
        if (this.state === ButtonStates.disabled)
            return;

        switch (e.button) {
            case 0: // left
                if (this.state === ButtonStates.click) {
                    this.state = ButtonStates.off;

                    Game.ws.send(Game.ContextMenu.leftclickMenuOption);
                }
            break;
            case 2: // right
            break;
        }
    }

    Game.TradeSlot = TradeSlot;
}());