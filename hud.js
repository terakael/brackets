(function() {
    function HUD(rect) {
        this.rect = rect;

        this.attackStyleButton = {
            rect: new Game.Rectangle(~~(this.rect.left + 10) + 0.5, ~~(this.rect.bottom - 16 - 10) + 0.5, this.rect.width - 20, 16),
            background: "black",
            backgroundHover: "gray",
            fillStyle: "black",
            strokeStyle: "white",
            textColour: "white",
            request: {
                action: "toggle_attack_style"
            }
        }
    }

    HUD.prototype.mouseWithin = function(mousePos) {
        return this.rect && this.rect.pointWithin(mousePos);
    }

    HUD.prototype.draw = function(context) {
        context.save();

        context.fillStyle = this.attackStyleButton.fillStyle;
        context.fillRect(this.attackStyleButton.rect.left, this.attackStyleButton.rect.top, this.attackStyleButton.rect.width, this.attackStyleButton.rect.height);
        
        context.lineWidth = 1;
        context.strokeStyle = this.attackStyleButton.strokeStyle;
        context.strokeRect(this.attackStyleButton.rect.left, this.attackStyleButton.rect.top, this.attackStyleButton.rect.width, this.attackStyleButton.rect.height);

        context.fillStyle = this.attackStyleButton.textColour;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "12pt Consolas";
        context.fillText(Game.currentPlayer.getCurrentAttackStyle(), this.attackStyleButton.rect.left + (this.attackStyleButton.rect.width / 2), this.attackStyleButton.rect.top + (this.attackStyleButton.rect.height / 2));
        
        context.restore();
    }

    HUD.prototype.process = function(dt) {
        this.attackStyleButton.fillStyle = this.attackStyleButton.rect.pointWithin(Game.mousePos) 
            ? this.attackStyleButton.backgroundHover 
            : this.attackStyleButton.background;
    }

    HUD.prototype.onMouseDown = function(e) {
        if (this.attackStyleButton.rect.pointWithin(Game.mousePos)) {
            Game.ws.send(this.attackStyleButton.request);
        }
    }

    HUD.prototype.onMouseUp = function(e) {
        
    }

    Game.HeadsUpDisplay = HUD;
}());