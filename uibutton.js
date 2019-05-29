(function() {
    function UIButton(title) {
        this.rect = new Game.Rectangle(0, 0, 100, 75);

        this.state = "off";
        this.title = title;

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

        var offsetX = this.state === "click" ? 2 : 0;
        var offsetY = this.state === "click" ? 2 : 0;

        // context.fillStyle = this.hover ? this.hoverFillStyle : this.fillStyle;
        // context.strokeStyle = this.hover ? this.hoverStrokeStyle : this.strokeStyle;
        context.fillRect(this.rect.left + offsetX, this.rect.top + offsetY, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left + offsetX, this.rect.top + offsetY, this.rect.width, this.rect.height);

        // TODO button title, icon etc
        context.textAlign = "center";
        context.textBaseline = "top";
        context.font = "15px Consolas";
        context.fillStyle = "white";
        context.fillText(this.title, this.rect.left + (this.rect.width / 2) + offsetX, this.rect.top + 10 + offsetY);
        
        context.restore();
    }

    UIButton.prototype.setFillStrokeStyle = function(context) {
        switch (this.state) {
            case "hover":
                context.fillStyle = this.hoverFillStyle;
                context.strokeStyle = this.hoverStrokeStyle;
                break;
            case "click":
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
            if (this.state != "click") 
                this.state = "hover";
        } else {
            this.state = "off";
        }
    }

    UIButton.prototype.onMouseDown = function(e) {
        if (this.rect.pointWithin(Game.mousePos)) {
            // todo send message
            this.state = "click";
        }
    }

    UIButton.prototype.onMouseUp = function(e) {
        if (this.state === "click")
            this.state = "off";
    }

    Game.UIButton = UIButton;
}());