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

        this.boosts = [
            { name: "str", amount: 0 },
            { name: "acc", amount: 0 },
            { name: "def", amount: 0 },
            { name: "agil", amount: 0 },
            { name: "hp", amount: 0 },
			{ name: "mage", amount: 0 },
			{ name: "mine", amount: 0 },
			{ name: "smith", amount: 0 },
			{ name: "herb", amount: 0 },
        ];

        this.bonuses = null;
        
        this.x = 10;
        this.y = 20;
        this.healthBarTimer = 0;
    }
    Stats.prototype.exp2lvl = function(exp) {
        let lvl = 99;
        for (let [key, value] of Game.expMap) {
            if (exp < value)
                return key - 1;
        }

        return lvl;
    }
    Stats.prototype.lvl2exp = function(lvl) {
        if (Game.expMap.has(lvl))
            return Game.expMap.get(lvl);

        if (lvl < 1)
            return 1;

        if (lvl > 99)
            return 99;
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
        ctx.save();
        ctx.font = "15px Consolas";
        ctx.textAlign = "left";
        ctx.fillStyle = "#555";
		ctx.fillText("Stats", ~~(this.x + xview) + 0.5, ~~(yview - 5) + 0.5);
		ctx.strokeStyle = "rgba(100, 100, 100, 0.6)";
        var statBoxWidth = 230;

        ctx.textAlign = "right";
        ctx.fillStyle = "red";
        ctx.fillText("cmb: " + Game.currentPlayer.combatLevel, ~~(this.x + xview + statBoxWidth - 10) + 0.5, ~~(yview - 5) + 0.5);

        var spritemap = Game.SpriteManager.getSpriteMapById(10);
        
        var hoverStatId = null;
        ctx.lineWidth = 1;
        for (var i = 0; i < this.stats.length; ++i) {
            var xOffset = (i % 3) * 80; 
            var name = this.stats[i].name;
            var exp = this.stats[i].exp;

            var clickbox = new Game.Rectangle(this.x + xview + xOffset, this.y + yview + (this.y * ~~(i/3)) - 8, 80, 16);
            if (clickbox.pointWithin(Game.mousePos)) {
                ctx.fillStyle = "rgba(100, 100, 100, 0.6)";
                ctx.fillRect(clickbox.left, clickbox.top, clickbox.width, clickbox.height);
                hoverStatId = i;
            }

            ctx.drawImage(spritemap, (i%3) * 32, ~~(i/3) * 32, 32, 32, this.x + xview + xOffset, this.y + yview + (this.y * ~~(i/3)) - 8, 16, 16);

            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "red";
            ctx.fillText("{0}/{1}".format(this.stats[i].lvl + this.boosts[i].amount, this.stats[i].lvl), this.x + xview + 20 + xOffset, this.y + yview + (this.y * ~~(i/3)));

            // if (name === "hp") {
            //     ctx.fillText("{1}/{2}".format(name, Game.currentPlayer.currentHp, this.stats[i].lvl, exp), this.x + xview + 20 + xOffset, this.y + yview + (this.y * ~~(i/3)));
            // } else {
                
            // }
        }
        
        
        var yOffset = this.y + yview + ~~(this.stats.length / 3) * 16 + 5;
        ctx.strokeRect(~~(this.x + xview) + 0.5, ~~yOffset + 0.5, statBoxWidth, 16);
        if (hoverStatId !== null) {
            var expSinceLvl = this.stats[hoverStatId].exp - this.lvl2exp(this.stats[hoverStatId].lvl);
            var expDiff = this.lvl2exp(this.stats[hoverStatId].lvl + 1) - this.lvl2exp(this.stats[hoverStatId].lvl);
            var remaining = (expSinceLvl / expDiff);
            ctx.fillStyle = "rgba(0, 100, 0, 0.6)";
            ctx.fillRect(this.x + xview, yOffset, remaining * statBoxWidth, 16);

            ctx.textAlign = "center";
            ctx.fillStyle = "red";
            ctx.textBaseline = "middle";
            ctx.fillText("{0}: {1}xp ({2}%)".format(this.stats[hoverStatId].name, this.stats[hoverStatId].exp, ~~(remaining * 100)), this.x + xview + (statBoxWidth / 2), yOffset + 8);
        } else {
            ctx.textAlign = "center";
            ctx.fillStyle = "red";
            ctx.textBaseline = "middle";
            ctx.fillText("total: {0} ({1}xp)".format(this.totalLvl(), this.totalExp()), this.x + xview + (statBoxWidth / 2), yOffset + 8);
        }

        ctx.font = "15px Consolas";
        ctx.textAlign = "left";
        ctx.fillStyle = "#555";
        yOffset += 30;
        ctx.fillText("Bonuses", ~~(this.x + xview) + 0.5, ~~yOffset + 0.5);
        yOffset += 15;

        var bonusStats = ["acc", "str", "def", "agil", "hp"];
        for (var i = 0; i < this.stats.length; ++i) {
            if (!bonusStats.includes(this.stats[i].name))
                continue;

            var xOffset = (i % 5) * 45; 

            ctx.drawImage(spritemap, (i%3) * 32, ~~(i/3) * 32, 32, 32, this.x + xview + xOffset, yOffset - 8, 16, 16);

            ctx.textBaseline = "middle";
            ctx.fillStyle = "red";

            var bonus = (this.bonuses && this.bonuses[this.stats[i].name]) || 0;
            ctx.fillText(bonus, this.x + xview + 16 + xOffset, yOffset);
        }

        ctx.restore();
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
    Stats.prototype.setBoost = function(stat, boost) {
        for (var i = 0; i < this.stats.length; ++i) {
            if (this.boosts[i].name === stat) {
                this.boosts[i].amount = boost;
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
    Stats.prototype.setBoosts = function(boosts) {
        for (let [key, value] of Game.statMap) {
            this.setBoost(value, boosts[key]);
        }
    }
    Stats.prototype.getBoostByStat = function(stat) {
        for (var i = 0; i < this.boosts.length; ++i) {
            if (this.boosts[i].name === stat)
                return this.boosts[i].amount;
        }
        return 0;
    }
    Stats.prototype.getCurrentHp = function() {
        return this.getLevelByStat("hp") + this.getBoostByStat("hp");
    }
    window.Game.Stats = Stats;
}());