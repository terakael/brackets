(function() {
    var ButtonStates = {
        off: 0,
        hover: 1,
        click: 2,
        disabled: 3
    }

    function UIButton(buttonInfo) {
        this.rect = new Rectangle(0, 0, 100, 75);

        if (Game.currentPlayer.stats.getLevelByStat("smith") < buttonInfo.level)
            this.state = ButtonStates.disabled;
        else
            this.state = ButtonStates.off;
            
        this.buttonInfo = buttonInfo;

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
        context.fillStyle = Game.currentPlayer.stats.getLevelByStat("smith") < this.buttonInfo.level ? "red" : "white";

        // required smithing level
        context.fillText("lvl: " + this.buttonInfo.level, this.rect.left + this.rect.width + buttonOffsetX - 5, this.rect.top + buttonOffsetY + 5);

        // draw the icon
        const drawItem = SpriteManager.getItemById(this.buttonInfo.itemId);
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
        for (var i = 1; i < 5; ++i) {
            var material = "material" + i;
            if (!this.buttonInfo.hasOwnProperty(material))
                break;

            if (this.buttonInfo[material] === 0)
                continue;

            var materialItem = SpriteManager.getItemById(this.buttonInfo[material]);
            var posx = this.rect.left + ((i - 1) * 45) + materialItem.spriteFrame.getCurrentFrame().width / 2;
            var posy = this.rect.bottom - materialItem.spriteFrame.getCurrentFrame().height / 2;
            materialItem.draw(context, posx + buttonOffsetX, posy + buttonOffsetY);
            context.fillText("x" + this.buttonInfo["count" + i] || 0, posx + 10 + buttonOffsetX, posy + buttonOffsetY);
        }

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
            
            Game.ContextMenu.setLeftclick(Game.mousePos, {
                id: Game.currentPlayer.id,
                action: "smith", 
                objectName: this.buttonInfo.itemName,
                itemId: this.buttonInfo.itemId
            });
        } else {
            this.state = ButtonStates.off;
        }
    }

    UIButton.prototype.onMouseDown = function(e) {
        if (this.state === ButtonStates.disabled)
            return;
    
        if (this.rect.pointWithin(Game.mousePos)) {
            // todo send message
            this.state = ButtonStates.click;
        }
    }

    UIButton.prototype.onMouseUp = function(e) {
        if (this.state === ButtonStates.disabled)
            return;

        if (this.state === ButtonStates.click) {
            this.state = ButtonStates.off;

            Game.ws.send({
                id: Game.currentPlayer.id,
                action: "smith",
                itemId: this.buttonInfo.itemId
            });

            // close the window
            Game.activeUiWindow = null;
        }
    }

    Game.UIButton = UIButton;
}());