(function() {
    function Stats() {
        this.stats = [
            { name: "str", exp: 0 },
            { name: "acc", exp: 0 },
            { name: "def", exp: 0 },
            { name: "agil", exp: 0 },
            { name: "hp", exp: 10 },
			{ name: "mage", exp: 0 },
			{ name: "mine", exp: 0 },
			{ name: "smith", exp: 0 },
			{ name: "herb", exp: 0 },
        ];
        for (var i = 0; i < this.stats.length; ++i) {
            this.stats[i].lvl = this.exp2lvl(this.stats[i].exp);
        }
        this.x = 10;
        this.y = 20;
        this.healthBarTimer = 0;
        this.currentHp = 1;
    }
    Stats.prototype.exp2lvl = function(exp) {
        return ~~Math.sqrt(exp);
    }
    Stats.prototype.lvl2exp = function(lvl) {
        return lvl * lvl;
    }
	Stats.prototype.totalExp = function() {
		var exp = 0;
		for (var i = 0; i < this.stats.length; ++i) {
			exp += this.stats[i].exp;
		}
		return exp;
	}
	Stats.prototype.totalLvl = function() {
		var total = 0;
		for (var i = 0; i < this.stats.length; ++i) {
			total += this.exp2lvl(this.stats[i].exp);
		}
		return total;
    }
    Stats.prototype.draw = function(ctx, xview, yview) {
        ctx.font = "15px Consolas";
        ctx.textAlign = "left";
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
            if (name === "hp") {
                ctx.fillText("{0}: {1} / {2} ({3}xp)".format(name, this.currentHp, this.stats[i].lvl, exp), this.x + xview + 10, this.y + yview + (this.y * i));
            } else {
                ctx.fillText("{0}: {1} / {1} ({2}xp)".format(name, this.stats[i].lvl, exp), this.x + xview + 10, this.y + yview + (this.y * i));
            }
        }
		ctx.fillText("total: {0} ({1}xp)".format(this.totalLvl(), this.totalExp()), this.x + xview + 10, this.y + yview + (this.y * this.stats.length));
    }
    Stats.prototype.process = function(dt) {
        if (this.healthBarTimer > 0) {
            this.healthBarTimer -= dt;
            if (this.healthBarTimer < 0)
                this.healthBarTimer = 0;
        }
    }
    Stats.prototype.drawHealthBar = function(ctx, x, y, currentHp, maxHp) {
        if (this.healthBarTimer === 0)
            return false;

        var barLength = 32;
        var currentHpLength = ~~(barLength * (currentHp/maxHp));

        ctx.fillStyle = "#0f0";
        ctx.fillRect(x - ~~(barLength/2), y - 2.5, currentHpLength, 5);

        ctx.fillStyle = "#f00";
        ctx.fillRect(x - ~~(barLength/2) + currentHpLength, y - 2.5, barLength - currentHpLength, 5);
        return true;
    }
    Stats.prototype.gainExp = function(stat, exp) {
        exp = exp || 0;
        for (var i = 0; i < this.stats.length; ++i) {
            if (this.stats[i].name === stat) {
				var oldLevel = this.stats[i].lvl;
                this.stats[i].exp += exp;
				this.stats[i].lvl = this.exp2lvl(this.stats[i].exp);
				if (this.stats[i].lvl > oldLevel) {
					Game.ChatBox.add("Your {0} level is now {1}!".format(this.stats[i].name, this.stats[i].lvl), '#0f0');
				}
                return;
            }
        }
    }
    Stats.prototype.setExp = function(stat, exp) {
        for (var i = 0; i < this.stats.length; ++i) {
            if (this.stats[i].name === stat) {
                this.stats[i].exp = exp;
                this.stats[i].lvl = this.exp2lvl(this.stats[i].exp);
            }
        }
    }
    Stats.prototype.showHealthBar = function() {
        this.healthBarTimer = 5;
    }
    Stats.prototype.getLevelByStat = function(stat) {
        for (var i = 0; i < this.stats.length; ++i) {
            if (this.stats[i].name === stat)
                return this.exp2lvl(this.stats[i].exp);
        }
        return 0;
    }
    window.Game.Stats = Stats;
}());