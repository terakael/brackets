(function() {
    function UIWindow(rect, smithingOptions, storedCoal) {
        this.rect = rect;

        let buttons = [];
        for (let i = 0; i < smithingOptions.length; ++i) {
            buttons.push(new Game.UIButton(smithingOptions[i]));
        }
        this.uiButtons = buttons.sort((a, b) => a.buttonInfo.level - b.buttonInfo.level);
        this.storedCoal = storedCoal;
        this.onResize(rect);
    }
    
    UIWindow.prototype.draw = function(context, xview, yview) {
        context.save();
        context.fillStyle = this.background || "black";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        context.textAlign = "center";
        context.fillStyle = "white";

        var y = this.rect.top + 20;
        context.fillText("- select which item you want to forge -", this.rect.left + (this.rect.width / 2), y);
        
        for (var i = 0; i < this.uiButtons.length; ++i) {
            this.uiButtons[i].draw(context);
        }
        
        context.textAlign = "right";
        context.font = "12px customFont";
        context.fillText("stored coal: " + this.storedCoal, this.rect.left + this.rect.width - 10, this.rect.top + this.rect.height - 8);
        context.restore();
    }

    UIWindow.prototype.process = function(dt) {
        for (var i = 0; i < this.uiButtons.length; ++i) 
            this.uiButtons[i].process(dt);
    }

    UIWindow.prototype.onMouseDown = function(e) {
        if (!this.rect.pointWithin(Game.mousePos)) {
            Game.activeUiWindow = null;
        } else {
            for (var i = 0; i < this.uiButtons.length; ++i) {
                this.uiButtons[i].onMouseDown(e);
            }
        }
    }

    UIWindow.prototype.onMouseUp = function(e) {
        for (var i = 0; i < this.uiButtons.length; ++i) {
            this.uiButtons[i].onMouseUp(e);
        }
    }

    UIWindow.prototype.onMouseScroll = function(e) {
        
    }

    UIWindow.prototype.onResize = function(worldRect) {
        let uiWidth = worldRect.width / 2;
        let uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;

        const slotRectWidth = this.uiButtons[0].rect.width;
        const slotRectHeight = this.uiButtons[0].rect.height;

        let maxRows = Math.max(~~(uiWidth / (slotRectWidth + 10)), 1);
        let uiHeight = Math.max(Math.ceil(this.uiButtons.length / maxRows), 2) * (slotRectHeight + 10) + 50;
        let uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;

        this.rect = new Rectangle(uix, uiy, uiWidth, uiHeight);
        
        let margin = ((this.rect.width - (maxRows * (slotRectWidth + 10))) / 2);
        for (let i = 0; i < this.uiButtons.length; ++i) {
            let currentRow = ~~(i / maxRows);
            let currentColumn = i % maxRows;
            this.uiButtons[i].rect.setPos(this.rect.left + margin + (currentColumn * (slotRectWidth + 10)), this.rect.top + 30 + (currentRow * (slotRectHeight + 10)));
        }
    }

    Game.UIWindow = UIWindow;
}());