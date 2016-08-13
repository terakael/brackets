(function() {
    function Grid() {
        this.x = 0;
        this.y = 0;
        this.lines = [];
    }
    
    Grid.prototype.draw = function(ctx, xview, yview) {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        
        for (var line in this.lines) {
            ctx.moveTo(~~(this.lines[line].x1 - xview) + 0.5, ~~(this.lines[line].y1 - yview) + 0.5);
            ctx.lineTo(~~(this.lines[line].x2 - xview) + 0.5, ~~(this.lines[line].y2 - yview) + 0.5);
        }
        
        ctx.stroke();
    }
    
    Grid.prototype.createGridLines = function(w, h, ox, oy) {
        ox = ox || 0;
        oy = oy || 0;
        // vertical lines
        for (var i = 0 + ox; i < w + ox; i += 16) {
            this.lines.push({x1: i, y1: 0, x2: i, y2: h});
        }
        for (var i = 0 + oy; i < h + oy; i += 16) {
            this.lines.push({x1: 0, y1: i, x2: w, y2: i});
        }
    }
    
    window.Game.Grid = Grid;
}());