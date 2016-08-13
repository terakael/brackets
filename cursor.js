(function() {
    function Cursor(drawx, drawy) {
        this.mousePos = {};
        this.drawpos = {x: drawx || 10, y: drawy || 20};
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
        context.fillStyle = "red";
        context.fillText("({0},{1})({2},{3})".format(~~this.mousePos.x, ~~this.mousePos.y,~~xview, ~~yview), ~~this.mousePos.x - (this.mousePos.x%32) - (xview%32), ~~this.mousePos.y - (this.mousePos.y%32) - (yview%32));
        context.restore();
		
        context.fillRect(~~this.mousePos.x - (this.mousePos.x%32) - (xview%32), ~~this.mousePos.y - (this.mousePos.y%32) - (yview%32), 30, 30);
    }
    
    Game.Cursor = Cursor;
}());