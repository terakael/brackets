(function() {
    function UIWindow(rect, background) {
        this.rect = rect;
        this.background = background;
        this.uiButtons = null;
        this.otherInfo = {};
    }

    UIWindow.prototype.setButtons = function(buttons) {
        this.uiButtons = buttons;
        var initialBuffer = 30;
        var buffer = 15;

        let buttonRows = Math.floor(this.uiButtons.length / 4) + 1;
        let x = this.rect.left;
        let h = initialBuffer + (buttonRows * buffer) + (buttonRows * this.uiButtons[0].rect.height);
        let y = (Game.worldCameraRect.height / 2) - (h / 2);
        let w = this.rect.width;
        this.rect.set(x, y, w, h);

        for (var i = 0; i < this.uiButtons.length; ++i) {
            this.uiButtons[i].setLocalPosition(
                this.rect.left + buffer + ((i % 4) * buffer) + ((i % 4) * this.uiButtons[i].rect.width),
                this.rect.top + initialBuffer + (Math.floor(i / 4) * buffer) + (Math.floor(i / 4) * this.uiButtons[i].rect.height)
            );
        }
    }
    
    UIWindow.prototype.draw = function(context, xview, yview) {
        context.save();
        context.fillStyle = this.background || "black";
        context.strokeStyle = "red";
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
        context.font = "12px Consolas";
        context.fillText("stored coal: " + this.otherInfo.storedCoal, this.rect.left + this.rect.width - 10, this.rect.top + this.rect.height - 8);
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

    Game.UIWindow = UIWindow;
}());