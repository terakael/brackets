(function() {
    function Cursor(drawx, drawy) {
        this.mousePos = {};
        this.drawpos = {x: drawx || 10, y: drawy || 20};
        this.size = 32;
    }
    Cursor.prototype.pos = function() {
        return this.mousePos;
    }
    Cursor.prototype.setPos = function (pos) {
        this.mousePos.x = pos.x;
        this.mousePos.y = pos.y;
    }
    Cursor.prototype.draw = function(context, xview, yview) {
        context.save();
        context.textAlign = "center";
        context.strokeStyle = "rgba(255, 255, 255, 0.2)";
        context.fillStyle = "rgba(255, 255, 255, 0.1)";
        context.lineWidth = 3;
        var realx = ~~(this.mousePos.x);
        var realy = ~~(this.mousePos.y);
        context.fillRect((~~(realx / this.size) * this.size) - xview, (~~(realy / this.size) * this.size) - yview, this.size, this.size);
        context.strokeRect((~~(realx / this.size) * this.size) - xview, (~~(realy / this.size) * this.size) - yview, this.size, this.size);
        context.restore();
    }
    
    Game.Cursor = Cursor;
}());