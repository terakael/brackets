(function() {
    function Stats() {
        this.stats = [
            { name: "str", exp: 2218 },
            { name: "acc", exp: 1596 },
            { name: "def", exp: 562 },
            { name: "agil", exp: 1026 },
            { name: "hp", exp: 1909 }            
        ];
        for (var i = 0; i < this.stats.length; ++i) {
            this.stats[i].lvl = this.exp2lvl(this.stats[i].exp);
        }
        this.x = 10;
        this.y = 20;
    }
    Stats.prototype.exp2lvl = function(exp) {
        return ~~Math.sqrt(exp);
    }
    Stats.prototype.lvl2exp = function(lvl) {
        return lvl * lvl;
    }
    Stats.prototype.draw = function(ctx, xview, yview) {
        ctx.font = "15px Consolas";
        ctx.fillStyle = "#555";
		ctx.fillText("Stats", ~~(this.x + xview) + 0.5, ~~(yview - 5) + 0.5);
		ctx.strokeStyle = "rgba(100, 100, 100, 0.6)";
        var statBoxWidth = 230;
		
        ctx.lineWidth = 1;
        for (var i = 0; i < this.stats.length; ++i) {
            var name = this.stats[i].name;
            var exp = this.stats[i].exp;

            var expSinceLvl = this.stats[i].exp - this.lvl2exp(this.stats[i].lvl);
            var expDiff = this.lvl2exp(this.stats[i].lvl + 1) - this.lvl2exp(this.stats[i].lvl);
            var remaining = (expSinceLvl / expDiff);
            ctx.strokeRect(~~(this.x + xview) + 0.5, ~~(this.y + yview + (this.y * i) - 15) + 0.5, statBoxWidth, 20);
            ctx.fillStyle = "rgba(0, 100, 0, 0.6)";
            ctx.fillRect(this.x + xview, this.y + yview + (this.y * i) - 15, remaining * statBoxWidth, 20);
            
            ctx.fillStyle = "red";
            ctx.fillText("{0}: {1} / {1} ({2}xp)".format(name, this.stats[i].lvl, exp), this.x + xview + 10, this.y + yview + (this.y * i));
        }
    }
    Stats.prototype.gainExp = function(stat, exp) {
        exp = exp || 0;
        for (var i = 0; i < this.stats.length; ++i) {
            if (this.stats[i].name === stat) {
				var oldLevel = this.stats[i].lvl;
                this.stats[i].exp += exp;
				this.stats[i].lvl = this.exp2lvl(this.stats[i].exp);
				if (this.stats[i].lvl > oldLevel) {
					Game.ChatBox.add("Your {0} level is now {1}!".format(this.stats[i].name, this.stats[i].lvl));
				}
                return;
            }
        }
    }
    window.Game.Stats = Stats;
}());