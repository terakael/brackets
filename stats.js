(function() {
    function Stats(rect) {
        this.stats = [
            { name: "str", exp: 0 },
            { name: "acc", exp: 0 },
            { name: "def", exp: 0 },
            { name: "pray", exp: 0 },
            { name: "hp", exp: 10 },
			{ name: "mage", exp: 0 },
			{ name: "mine", exp: 0 },
			{ name: "smith", exp: 0 },
            { name: "herb", exp: 0 },
            { name: "fish", exp: 0 },
            { name: "cook", exp: 0 },
        ];
        for (var i = 0; i < this.stats.length; ++i) {
            this.stats[i].lvl = this.exp2lvl(this.stats[i].exp);
        }

        this.boosts = [
            { name: "str", amount: 0 },
            { name: "acc", amount: 0 },
            { name: "def", amount: 0 },
            { name: "pray", amount: 0 },
            { name: "hp", amount: 0 },
			{ name: "mage", amount: 0 },
			{ name: "mine", amount: 0 },
			{ name: "smith", amount: 0 },
            { name: "herb", amount: 0 },
            { name: "fish", amount: 0 },
            { name: "cook", amount: 0 },
        ];

        this.expDrops = [];
        this.statIconSpriteMap = SpriteManager.getSpriteMapById(10);

        this.bonuses = null;
        
        this.x = 10;
        this.y = 20;
        this.healthBarTimer = 0;
        this.hoverStatId = null;

        this.rect = rect;
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

        if (lvl > 99)
            return 99;

        return 1;
    }
	Stats.prototype.totalExp = function() {
        return this.stats.map(e => e.exp).reduce((a, b) => a + b);
	}
	Stats.prototype.totalLvl = function() {
        return this.stats.map(e => this.exp2lvl(e.exp)).reduce((a, b) => a + b);
    }
    Stats.prototype.draw = function(ctx, xview, yview) {
        ctx.save();
        ctx.font = "15px customFont";
        ctx.textAlign = "left";
        ctx.fillStyle = "#555";
		ctx.fillText("stats", ~~(this.x + xview) + 0.5, ~~(yview) + 0.5);
		ctx.strokeStyle = "rgba(100, 100, 100, 0.6)";
        let statBoxWidth = 230;

        ctx.textAlign = "right";
        ctx.fillStyle = "red";
        ctx.fillText("cmb: " + Game.currentPlayer.combatLevel, ~~(this.x + xview + statBoxWidth - 25) + 0.5, ~~(yview) + 0.5);

        // ctx.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        
        let hoveringOverAStat = false;
        ctx.lineWidth = 1;
        for (let i = 0; i < this.stats.length; ++i) {
            let xOffset = (i % 3) * 80; 

            let clickbox = new Rectangle(this.x + xview + xOffset, this.y + yview + (this.y * ~~(i/3)) - 8, 80, 16);
            if (clickbox.pointWithin(Game.mousePos)) {
                ctx.fillStyle = "rgba(100, 100, 100, 0.6)";
                ctx.fillRect(clickbox.left, clickbox.top, clickbox.width, clickbox.height);
                this.hoverStatId = i;
                hoveringOverAStat = true;
            }

            if (this.statIconSpriteMap)
                ctx.drawImage(this.statIconSpriteMap, (i%3) * 32, ~~(i/3) * 32, 32, 32, this.x + xview + xOffset, this.y + yview + (this.y * ~~(i/3)) - 8, 16, 16);

            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "red";
            ctx.fillText("{0}/{1}".format(this.stats[i].lvl + this.boosts[i].amount, this.stats[i].lvl), this.x + xview + 20 + xOffset, this.y + yview + (this.y * ~~(i/3)));
        }

        if (!hoveringOverAStat)
            this.hoverStatId = null;
        
        
        let yOffset = this.y + yview + ~~(this.stats.length / 3) * (16 + 5) + 10;
        ctx.strokeRect(~~(this.x + xview) + 0.5, ~~yOffset + 0.5, statBoxWidth, 16);
        if (this.hoverStatId !== null) {
            let expSinceLvl = this.stats[this.hoverStatId].exp - this.lvl2exp(this.stats[this.hoverStatId].lvl);
            let expDiff = this.lvl2exp(this.stats[this.hoverStatId].lvl + 1) - this.lvl2exp(this.stats[this.hoverStatId].lvl);
            let remaining = (expSinceLvl / expDiff);
            ctx.fillStyle = "rgba(0, 100, 0, 0.6)";
            ctx.fillRect(this.x + xview, yOffset, remaining * statBoxWidth, 16);

            ctx.textAlign = "center";
            ctx.fillStyle = "red";
            ctx.textBaseline = "middle";
            ctx.fillText("{0}: {1}xp ({2}%)".format(this.stats[this.hoverStatId].name, ~~this.stats[this.hoverStatId].exp, ~~(remaining * 100)), this.x + xview + (statBoxWidth / 2), yOffset + 8);
        } else {
            ctx.textAlign = "center";
            ctx.fillStyle = "red";
            ctx.textBaseline = "middle";
            ctx.fillText("total: {0} ({1}xp)".format(this.totalLvl(), ~~this.totalExp()), this.x + xview + (statBoxWidth / 2), yOffset + 8);
        }

        ctx.font = "15px customFont";
        ctx.textAlign = "left";
        ctx.fillStyle = "#555";
        yOffset += 30;
        ctx.fillText("bonuses", ~~(this.x + xview) + 0.5, ~~yOffset + 0.5);
        yOffset += 15;

        let bonusStats = ["acc", "str", "def", "pray", "mage", "hp"];
        for (let i = 0; i < this.stats.length; ++i) {
            if (!bonusStats.includes(this.stats[i].name))
                continue;

                let xOffset = (i % 6) * 38; 

            if (this.statIconSpriteMap)
                ctx.drawImage(this.statIconSpriteMap, (i%3) * 32, ~~(i/3) * 32, 32, 32, this.x + xview + xOffset, yOffset - 8, 16, 16);

            ctx.textBaseline = "middle";
            ctx.fillStyle = "red";

            let bonus = (this.bonuses && this.bonuses[this.stats[i].name]) || 0;
            ctx.fillText(bonus, this.x + xview + 16 + xOffset, yOffset);
        }

        ctx.textAlign = "right";
        ctx.font = "18px customFont";
        for (let i = 0; i < this.expDrops.length; ++i) {
            if (this.expDrops[i].lifetime === 1)
                continue;

            let yOffset = 100 * (1 - this.expDrops[i].lifetime);
            ctx.globalAlpha = this.expDrops[i].lifetime < 0.2 ? (this.expDrops[i].lifetime * 5) : 1;

            let expTextWidth = ctx.measureText(String(this.expDrops[i].exp)).width;
            if (this.statIconSpriteMap)
                ctx.drawImage(this.statIconSpriteMap, 
                            (this.expDrops[i].statId%3) * 32, 
                            ~~(this.expDrops[i].statId/3) * 32, 
                            32, 
                            32, 
                            this.rect.left - expTextWidth - 25, 
                            100 - yOffset - 8, 
                            16, 
                            16);
            ctx.fillText(this.expDrops[i].exp, this.rect.left - 10, 100 - yOffset);
        }
        

        ctx.restore();
    }
    Stats.prototype.process = function(dt) {
        if (this.healthBarTimer > 0) {
            this.healthBarTimer -= dt;
            if (this.healthBarTimer < 0)
                this.healthBarTimer = 0;
        }

        // basically if there's an exp drop that's not 1 but is greater than 0.9, we wanna pause
        // the exp drops that are set to 1 so they don't overlap eachother.
        let pauseMaxLifetimes = this.expDrops.filter(e => e.lifetime < 1 && e.lifetime > 0.8).length > 0;
        for (let i = 0; i < this.expDrops.length; ++i) {
            if (this.expDrops[i].lifetime === 1 && pauseMaxLifetimes)
                continue;

            this.expDrops[i].lifetime -= dt;
            pauseMaxLifetimes = this.expDrops.filter(e => e.lifetime < 1 && e.lifetime > 0.8).length > 0;
        }
        this.expDrops = this.expDrops.filter(e => e.lifetime > 0);
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
        for (var i = 0; i < this.stats.length; ++i) {
            if (this.stats[i].name === stat) {
				var oldLevel = this.stats[i].lvl;
                this.stats[i].exp += exp;
                this.stats[i].lvl = this.exp2lvl(this.stats[i].exp);                
				if (this.stats[i].lvl > oldLevel) {
					ChatBox.add("Your {0} level is now {1}!".format(this.stats[i].name, this.stats[i].lvl), '#0f0');
                }
                this.expDrops.push({statId: i, exp: ~~exp, lifetime: 1});
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
    Stats.prototype.onMouseDown = function() {
        if (this.hoverStatId == null)
            return;

        if (this.stats[this.hoverStatId].name === "herb") {
            Game.ws.send({
                action: "show_stat_window",
                id: Game.currentPlayer.id,
                statId: this.hoverStatId
            });
        }
    }
    Stats.prototype.onResize = function(newLeft) {
        this.rect.setPos(newLeft, this.rect.top);
    }
    window.Game.Stats = Stats;
}());