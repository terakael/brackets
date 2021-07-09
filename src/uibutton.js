(function() {
    var ButtonStates = {
        off: 0,
        hover: 1,
        click: 2,
        disabled: 3
    }

    function UIButton(smithingDto) {
        this.rect = new Rectangle(0, 0, 100, 75);

        if (Game.currentPlayer.stats.getLevelByStat("smith") < smithingDto.level)
            this.state = ButtonStates.disabled;
        else
            this.state = ButtonStates.off;
            
        this.smithingDto = smithingDto;

        this.leftclickOption = {
            action: "smith", 
            itemId: this.smithingDto.itemId,
            amount: 1,
            label: `smith 1 ${SpriteManager.getItemById(this.smithingDto.itemId).name}`
        }

        this.fillStyle = "#000";
        this.hoverFillStyle = "#222";
        this.clickFillStyle = "#444";

        this.strokeStyle = "#a00";
        this.hoverStrokeStyle = "#f00";
        this.clickStrokeSTyle = "#f00";
    }

    UIButton.prototype.setLocalPosition = function(x, y) {
        this.rect.setPos(~~(this.rect.left + x) + 0.5, ~~(this.rect.top + y) + 0.5);
    }
    
    UIButton.prototype.draw = function(context) {
        context.save();
        
        this.setFillStrokeStyle(context);
        context.lineWidth = 1;

        var buttonOffsetX = this.state === ButtonStates.click ? 2 : 0;
        var buttonOffsetY = this.state === ButtonStates.click ? 2 : 0;

        context.fillRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);

        context.textAlign = "right";
        context.textBaseline = "top";
        context.font = "12px customFont";
        context.fillStyle = Game.currentPlayer.stats.getLevelByStat("smith") < this.smithingDto.level ? "red" : "white";

        // required smithing level
        context.fillText("lvl: " + this.smithingDto.level, this.rect.left + this.rect.width + buttonOffsetX - 5, this.rect.top + buttonOffsetY + 5);

        // draw the icon
        const drawItem = SpriteManager.getItemById(this.smithingDto.itemId);
        const itemWidth = drawItem.spriteFrame.getCurrentFrame().width;
        const itemHeight = drawItem.spriteFrame.getCurrentFrame().height;

        const currentFrame = drawItem.spriteFrame.getCurrentFrame();
        const {spriteMapId, color} = drawItem.spriteFrame;
        const spriteMap = SpriteManager.getSpriteMapById(spriteMapId, color);
        if (spriteMap) {
            context.drawImage(spriteMap, 
                currentFrame.left, 
                currentFrame.top, 
                currentFrame.width, 
                currentFrame.height, 
                this.rect.left + (this.rect.width / 2) + buttonOffsetX - (itemWidth * 1.5), 
                this.rect.top + buttonOffsetY, 
                itemWidth * 1.5, 
                itemHeight * 1.5);
        }

        context.textAlign = "left";
        context.textBaseline = "middle";
        context.font = "15px customFont";

        // TODO check if player has required materials; change fillstyle based on this
        context.fillStyle = "white";
        // draw the materials

        const bar = SpriteManager.getItemById(this.smithingDto.barId);
        var posx = this.rect.left + 45 + bar.spriteFrame.getCurrentFrame().width / 2;
        var posy = this.rect.bottom - bar.spriteFrame.getCurrentFrame().height / 2;
        bar.draw(context, posx + buttonOffsetX, posy + buttonOffsetY);
        context.fillText(` x${this.smithingDto.requiredBars}`, posx + 10 + buttonOffsetX, posy + buttonOffsetY);

        if (this.state === ButtonStates.disabled) {
            context.fillStyle = "rgba(50, 50, 50, 0.5)";
            context.fillRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);
        }
        
        context.restore();
    }

    UIButton.prototype.setFillStrokeStyle = function(context) {
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

    UIButton.prototype.process = function(dt) {
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

    UIButton.prototype.onMouseDown = function(e) {
        if (this.state === ButtonStates.disabled)
            return;
    
        if (this.rect.pointWithin(Game.mousePos)) {
            if (e.button === 0) { // left
                this.state = ButtonStates.click;
            } else if (e.button === 2) { // right
                Game.ContextMenu.hide();// clear all the previous actions
                // context options
                Game.ContextMenu.push([this.leftclickOption]);

                let smithAmounts = [5, 10, 25];
                for (let i = 0; i < smithAmounts.length; ++i) {
                    Game.ContextMenu.push([{
                        action: "smith",
                        itemId: this.smithingDto.itemId,
                        amount: smithAmounts[i],
                        label: `smith ${smithAmounts[i] == 25 ? "all" : smithAmounts[i]} ${SpriteManager.getItemById(this.smithingDto.itemId).name}`
                    }]);
                }
            }
        }
    }

    UIButton.prototype.onMouseUp = function(e) {
        if (this.state === ButtonStates.disabled)
            return;

        if (e.button === 0 && this.state === ButtonStates.click) {
            this.state = ButtonStates.off;

            Game.ws.send(this.leftclickOption);

            // close the window
            Game.activeUiWindow = null;
        }
    }

    Game.UIButton = UIButton;
}());