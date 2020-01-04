(function() {
    function Cursor(drawx, drawy) {
        this.mousePos = {};
        this.clickPos = {};
        this.drawpos = {x: drawx || 10, y: drawy || 20};
        this.size = 32;
        this.cursorMaxLife = 1;
        this.cursorLife = 0;
        this.actionClick = false;
        this.drawCursor = false;
    }
    Cursor.prototype.pos = function() {
        return this.mousePos;
    }
    Cursor.prototype.setPos = function (pos) {
        this.mousePos.x = pos.x;
        this.mousePos.y = pos.y;
    }
    Cursor.prototype.draw = function(context, xview, yview) {
        if (this.drawCursor) {
            context.save();
            context.textAlign = "center";
            context.strokeStyle = "rgba(255, 255, 255, 0.2)";
            context.fillStyle = "rgba(255, 255, 255, 0.1)";
            context.lineWidth = 3;
            let realx = ~~(this.mousePos.x);
            let realy = ~~(this.mousePos.y);
            context.fillRect((~~(realx / this.size) * this.size) - xview, (~~(realy / this.size) * this.size) - yview, this.size, this.size);
            context.strokeRect((~~(realx / this.size) * this.size) - xview, (~~(realy / this.size) * this.size) - yview, this.size, this.size);

            let tileId = ~~(this.mousePos.x / this.size) + (~~(this.mousePos.y / this.size) * 250);
            context.textAlign = "center";
            context.textBaseline = "top";
            context.font = "10px Consolas";
            context.fillStyle = "white";
            context.fillText(tileId, (~~(realx / this.size) * this.size + (this.size/2)) - xview, (~~(realy / this.size) * this.size) - yview - (this.size/2));
            
            context.restore();
        }
        
        if (this.cursorLife > 0) {
            context.save();
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = "15px Consolas";
            context.fillStyle = "rgba(255, {0}, 0, {1}".format(this.actionClick ? 0 : 255, this.cursorLife);
            context.fillText("x", this.clickPos.x - xview, this.clickPos.y - yview);
            context.restore();
        }
    }
    Cursor.prototype.process = function(dt) {
        if (this.cursorLife > 0)
            this.cursorLife -= dt;
    }
    Cursor.prototype.handleClick = function(actionClick) {
        this.cursorLife = this.cursorMaxLife;
        this.clickPos = {x: this.mousePos.x, y: this.mousePos.y};
        this.actionClick = actionClick;
    }
    
    Game.Cursor = Cursor;
}());