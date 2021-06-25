(function() {
    let ButtonStates = {
        off: 0,
        hover: 1,
        click: 2,
        disabled: 3
    }

    function BankSlot(slot, itemId, currentStock, currentCharges, tileId) {
        this.slot = slot;
        this.rect = new Rectangle(0, 0, 50, 50);
        this.item = SpriteManager.getItemById(itemId);
        this.currentStock = currentStock;
        this.currentCharges = currentCharges;
        this.tileId = tileId;

        this.leftclickOption = {
            id: Game.currentPlayer.id,
            action: "withdraw", 
            objectName: this.item.name,
            objectId: this.item.id,
            amount: 1,
            slot: this.slot,
            label: `withdraw 1 ${this.item.name}`,
            tileId: this.tileId
        }

        this.fillStyle = "#000";
        this.hoverFillStyle = "#222";
        this.clickFillStyle = "#444";

        this.strokeStyle = "#a00";
        this.hoverStrokeStyle = "#f00";
        this.clickStrokeSTyle = "#f00";
    }

    BankSlot.prototype.setLocalPosition = function(x, y) {
        this.rect.set(~~(this.rect.left + x) + 0.5, ~~(this.rect.top + y) + 0.5);
    }
    
    BankSlot.prototype.draw = function(context) {
        context.save();
        
        this.setFillStrokeStyle(context);
        context.lineWidth = 1;

        const buttonOffsetX = this.state === ButtonStates.click ? 2 : 0;
        const buttonOffsetY = this.state === ButtonStates.click ? 2 : 0;

        context.fillRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);

        // draw the icon
        const itemWidth = this.item.spriteFrame.getCurrentFrame().width;
        const itemHeight = this.item.spriteFrame.getCurrentFrame().height;

        const currentFrame = this.item.spriteFrame.getCurrentFrame();
        const {spriteMapId, color} = this.item.spriteFrame;
        const spriteMap = SpriteManager.getSpriteMapById(spriteMapId, color);
        if (spriteMap) {
            context.drawImage(spriteMap, 
                currentFrame.left, 
                currentFrame.top, 
                currentFrame.width, 
                currentFrame.height, 
                this.rect.left + (this.rect.width / 2) + buttonOffsetX - (itemWidth / 2), 
                this.rect.top + (this.rect.height / 2) + buttonOffsetY - (itemHeight / 2), 
                itemWidth, 
                itemHeight);
        }
        context.textAlign = "right";
        context.textBaseline = "top";
        context.font = "12px customFont";
        context.fillStyle = countToFriendlyColor(this.currentStock);

        // current stock
        context.fillText(countToFriendly(this.currentStock), this.rect.left + this.rect.width + buttonOffsetX - 5, this.rect.top + buttonOffsetY + 5);

        if (this.item.isCharged()) {
            context.fillStyle = "red";
            context.textBaseline = "bottom";
            context.fillText(this.currentCharges, this.rect.left + this.rect.width + buttonOffsetX - 5, this.rect.bottom + buttonOffsetY - 5);
        }

        context.restore();
    }

    BankSlot.prototype.setFillStrokeStyle = function(context) {
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

    BankSlot.prototype.process = function(dt) {
        if (this.state === ButtonStates.disabled)
            return;

        if(this.rect.pointWithin(Game.mousePos)) {
            if (this.state !== ButtonStates.click) 
                this.state = ButtonStates.hover;
            
            Game.ContextMenu.setLeftclick(Game.mousePos, this.leftclickOption);
        } else {
            this.state = ButtonStates.off;
        }
    }

    BankSlot.prototype.onMouseDown = function(e) {
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
                    // context options
                    Game.ContextMenu.push([this.leftclickOption]);

                    let withdrawAmounts = [5, 10, "X", -1];
                    for (let i = 0; i < withdrawAmounts.length; ++i) {
                        if (withdrawAmounts[i] === "X") {
                            // deposit x
                            Game.ContextMenu.push([{
                                label: `withdraw X ${this.item.name}`,
                                callback: () => {
                                    ChatBox.requireInput("withdraw amount", /[0-9km]/).then(amount => {
                                        const intAmount = friendlyToCount(amount);
                                        if (intAmount > 0) {
                                            Game.ws.send({
                                                action: "withdraw",
                                                slot: this.slot,
                                                amount: intAmount,
                                                tileId: this.tileId
                                            });
                                        }
                                    });
                                }
                            }]);
                            continue;
                        }
                        
                        Game.ContextMenu.push([{
                            action: "withdraw",
                            slot: this.slot,
                            amount: withdrawAmounts[i],
                            label: `withdraw ${withdrawAmounts[i] == -1 ? "all" : withdrawAmounts[i]} ${this.item.name}`,
                            tileId: this.tileId
                        }]);
                    }

                    
                }
            break;
        }
            
    
        
    }

    BankSlot.prototype.onMouseUp = function(e) {
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

    Game.BankSlot = BankSlot;
}());