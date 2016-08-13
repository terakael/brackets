(function() {
    function Stats() {
        this.stats = [
            { name: "str", exp: 2218 },
            { name: "acc", exp: 1596 },
            { name: "def", exp: 562 },
            { name: "agil", exp: 1026 },
            { name: "hp", exp: 1909 }            
        ];
        this.x = 10;
        this.y = 20;
    }
    Stats.prototype.exp2lvl = function(exp) {
        return Math.floor(Math.sqrt(exp));
    }
    Stats.prototype.draw = function(ctx, xview, yview) {
        ctx.font = "15px Consolas";
        ctx.fillStyle = "#555";
		ctx.fillText("Stats", this.x + xview, yview - 5)
		ctx.strokeStyle = "#666";
		ctx.lineWidth = 3;
		ctx.strokeRect(this.x + xview, yview, 230, this.y * this.stats.length + 10);
		ctx.fillStyle = "#f00";
        for (var i = 0; i < this.stats.length; ++i) {
            var name = this.stats[i].name;
            var exp = this.stats[i].exp;
            var lvl = this.exp2lvl(exp);
            
            //var str = name + ": " + lvl + " / " + lvl + " (" + exp + "xp)";
            ctx.fillText("{0}: {1} / {1} ({2}xp)".format(name, lvl, exp), this.x + xview + 10, this.y + yview + (this.y * i));
        }
    }
    Stats.prototype.gainExp = function(stat, exp) {
        exp = exp || 0;
        for (var i = 0; i < this.stats.length; ++i) {
            if (this.stats[i].name === stat) {
				var oldLevel = this.exp2lvl(this.stats[i].exp);
                this.stats[i].exp += exp;
				var newLevel = this.exp2lvl(this.stats[i].exp);
				if (newLevel > oldLevel) {
					Game.ChatBox.add("Your {0} level is now {1}!".format(this.stats[i].name, newLevel));
				}
                return;
            }
        }
    }
    window.Game.Stats = Stats;
}());