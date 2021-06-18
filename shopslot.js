(function() {
    var ButtonStates = {
        off: 0,
        hover: 1,
        click: 2,
        disabled: 3
    }

    function ShopSlot(itemId, currentStock) {
        this.rect = new Rectangle(0, 0, 100, 75);
        this.item = SpriteManager.getItemById(itemId);
        this.currentStock = currentStock;

        this.leftclickOption = {
            id: Game.currentPlayer.id,
            action: "value", 
            objectName: this.item.name,
            objectId: this.item.id,
            valueTypeId: 0,// buy-value
            priority: 10
        }

        this.fillStyle = "#000";
        this.hoverFillStyle = "#222";
        this.clickFillStyle = "#444";

        this.strokeStyle = "#a00";
        this.hoverStrokeStyle = "#f00";
        this.clickStrokeSTyle = "#f00";
    }

    ShopSlot.prototype.setLocalPosition = function(x, y) {
        this.rect.set(~~(this.rect.left + x) + 0.5, ~~(this.rect.top + y) + 0.5);
    }
    
    ShopSlot.prototype.draw = function(context) {
        context.save();
        
        this.setFillStrokeStyle(context);
        context.lineWidth = 1;

        var buttonOffsetX = this.state === ButtonStates.click ? 2 : 0;
        var buttonOffsetY = this.state === ButtonStates.click ? 2 : 0;

        context.fillRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);

        context.textAlign = "right";
        context.textBaseline = "top";
        context.font = "12px customFont";
        context.fillStyle = "yellow";

        // current stock
        context.fillText(this.currentStock, this.rect.left + this.rect.width + buttonOffsetX - 5, this.rect.top + buttonOffsetY + 5);

        // draw the icon
        var itemWidth = this.item.spriteFrame.getCurrentFrame().width;
        var itemHeight = this.item.spriteFrame.getCurrentFrame().height;

        let spriteFrame = this.item.spriteFrame.getCurrentFrame();
        let spriteMap = SpriteManager.getSpriteMapById(this.item.spriteFrame.spriteMapId, this.item.spriteFrame.color);
        if (spriteMap) {
            context.drawImage(spriteMap, 
                spriteFrame.left, 
                spriteFrame.top, 
                spriteFrame.width, 
                spriteFrame.height, 
                this.rect.left + (this.rect.width / 2) + buttonOffsetX - ((itemWidth * 1.5) / 2), 
                this.rect.top + (this.rect.height / 2) + buttonOffsetY - ((itemHeight * 1.5) / 2), 
                itemWidth * 1.5, 
                itemHeight * 1.5);
        }
        context.restore();
    }

    ShopSlot.prototype.setFillStrokeStyle = function(context) {
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

    ShopSlot.prototype.process = function(dt) {
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

    ShopSlot.prototype.onMouseDown = function(e) {
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

                    let buyAmounts = [1, 5, 10];
                    for (let i = 0; i < buyAmounts.length; ++i) {
                        Game.ContextMenu.push([{
                            action: "buy",
                            objectId: this.item.id,
                            objectName: this.item.name,
                            amount: buyAmounts[i],
                            label: `buy ${buyAmounts[i]} ${this.item.name}`,
                            priority: 10
                        }]);
                    }
                }
            break;
        }
            
    
        
    }

    ShopSlot.prototype.onMouseUp = function(e) {
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

    Game.ShopSlot = ShopSlot;
}());