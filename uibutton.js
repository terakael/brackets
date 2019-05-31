(function() {
    var ButtonStates = {
        off: 0,
        hover: 1,
        click: 2
    }

    function UIButton(buttonInfo) {
        this.rect = new Game.Rectangle(0, 0, 100, 75);

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
        this.rect.set(~~(this.rect.left + x) + 0.5, ~~(this.rect.top + y) + 0.5);
    }
    
    UIButton.prototype.draw = function(context) {
        context.save();
        
        this.setFillStrokeStyle(context);

        var buttonOffsetX = this.state === ButtonStates.click ? 2 : 0;
        var buttonOffsetY = this.state === ButtonStates.click ? 2 : 0;

        context.fillRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);

        // TODO button title, icon etc
        context.textAlign = "right";
        context.textBaseline = "top";
        context.font = "15px Consolas";
        context.fillStyle = "white";
        var titleLines = this.buttonInfo.itemName.split(' ');
        for (var i = 0; i < titleLines.length; ++i)
            context.fillText(titleLines[i], this.rect.left + this.rect.width + buttonOffsetX - 5, this.rect.top + (10 * i) + buttonOffsetY + 5);

        // draw the icon
        var drawItem = Game.SpriteManager.getItemById(this.buttonInfo.itemId);
        var itemOffsetX = drawItem.spriteFrame.getCurrentFrame().width/2;
        var itemOffsetY = drawItem.spriteFrame.getCurrentFrame().height/2;
        drawItem.draw(context, this.rect.left + itemOffsetX + buttonOffsetX, this.rect.top + itemOffsetY + buttonOffsetY);

        context.textAlign = "left";
        context.textBaseline = "middle";
        // draw the materials
        for (var i = 1; i < 5; ++i) {
            var material = "material" + i;
            if (!this.buttonInfo.hasOwnProperty(material))
                break;

            if (this.buttonInfo[material] === 0)
                continue;

            var materialItem = Game.SpriteManager.getItemById(this.buttonInfo[material]);
            var posx = this.rect.left + ((i - 1) * 45) + materialItem.spriteFrame.getCurrentFrame().width / 2;
            var posy = this.rect.bottom - materialItem.spriteFrame.getCurrentFrame().height / 2;
            materialItem.draw(context, posx + buttonOffsetX, posy + buttonOffsetY);
            context.fillText("x" + this.buttonInfo["count" + i] || 0, posx + 10 + buttonOffsetX, posy + buttonOffsetY);
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
        if(this.rect.pointWithin(Game.mousePos)) {
            if (this.state !== ButtonStates.click) 
                this.state = ButtonStates.hover;
        } else {
            this.state = ButtonStates.off;
        }
    }

    UIButton.prototype.onMouseDown = function(e) {
        if (this.rect.pointWithin(Game.mousePos)) {
            // todo send message
            this.state = ButtonStates.click;
        }
    }

    UIButton.prototype.onMouseUp = function(e) {
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