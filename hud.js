(function() {
    function HUD(rect) {
        this.rect = rect;

        this.attackStyleButton = {
            rect: new Rectangle(~~(this.rect.left + this.rect.width - 20 - 8) + 0.5, 450-10 + 0.5, 16, 16),
            background: "black",
            backgroundHover: "gray",
            fillStyle: "black",
            strokeStyle: "white",
            textColour: "white",
            request: {
                action: "toggle_attack_style"
            },
            updateRect: function(hudRect) {
                this.rect.set(~~(hudRect.left + hudRect.width - 20 - 8) + 0.5, 450-10 + 0.5, 16, 16);
            }
        }

        this.activePrayers = [];
    }

    HUD.prototype.loadPrayers = function(prayers) {
        this.prayers = prayers;

        this.setPrayerRects(this.rect);
    }

    HUD.prototype.setPrayerRects = function(hudRect) {
        const boxesAcross = 6;
        const boxWidth = 32;
        for (let i = 0; i < this.prayers.length; ++i) {
            this.prayers[i].rect = new Rectangle(~~(hudRect.left + 15 + ((i % boxesAcross) * boxWidth + (i % boxesAcross * 5))) + 0.5,
                                            ~~(hudRect.bottom - 80 + (~~(i / boxesAcross) * boxWidth + (~~(i / boxesAcross) * 5))) + 0.5,
                                            boxWidth, boxWidth);
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

        let spriteRect = null;
        switch (Game.currentPlayer.getCurrentAttackStyle()) {
            case "aggressive":
                spriteRect = new Rectangle(0, 0, 32, 32);
                break;

            case "defensive":
                spriteRect = new Rectangle(64, 0, 32, 32);
                break;

            case "shared":
                spriteRect = new Rectangle(0, 32, 32, 32);
                break;
        }

        if (spriteRect && SpriteManager.getSpriteMapById(10))
            context.drawImage(SpriteManager.getSpriteMapById(10), 
                            spriteRect.left, 
                            spriteRect.top, 
                            spriteRect.width, 
                            spriteRect.height, 
                            this.attackStyleButton.rect.left, 
                            this.attackStyleButton.rect.top-1, 
                            this.attackStyleButton.rect.width, 
                            this.attackStyleButton.rect.height);

        this.drawPrayerSection(context);
        context.restore();
    }

    HUD.prototype.drawPrayerSection = function(ctx) {
        ctx.font = "15px customFont";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";
        ctx.fillStyle = "#555";
		ctx.fillText("prayers", this.rect.left + 10, this.rect.bottom - 95);

        ctx.strokeStyle = "gray";
        for (let i = 0; i < this.prayers.length; ++i) {
            const rect = this.prayers[i].rect;

            SpriteManager.getSpriteFrameById(this.prayers[i].iconId).draw(ctx, rect.left+16, rect.top+16);

            ctx.lineWidth = 1;
            if (rect.pointWithin(Game.mousePos)) {
                ctx.lineWidth = 3;

                const statRect = Game.currentPlayer.stats.rect;

                ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
                ctx.fillRect(statRect.left+10, statRect.top-10, statRect.width-20, statRect.height+10);
                ctx.strokeStyle = "gray";
                ctx.strokeRect(statRect.left+10, statRect.top-10, statRect.width-20, statRect.height+10);

                ctx.font = "17px customFont";
                ctx.fillStyle = "white";
                ctx.fillText(`"${this.prayers[i].name}"`, statRect.left + 20, statRect.top + 5);

                ctx.font = "13px customFont";
                ctx.fillText(`level ${this.prayers[i].level}`, statRect.left + 20, statRect.top + 35);
                ctx.fillText(`drain rate: ${this.prayers[i].drainRate}`, statRect.left + 20, statRect.top + 50);

                let str = wordWrap(this.prayers[i].description, 30).split("\n");
                for (let j = 0; j < str.length; ++j)
                    ctx.fillText(str[j], statRect.left + 20, statRect.top + 85 + (j * 15));
            }
            ctx.strokeStyle = "gray";
            ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

            if (this.activePrayers.includes(this.prayers[i].id)) {
                ctx.strokeStyle = "yellow";
                ctx.lineWidth = 3;
                ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
            }

            if (Game.currentPlayer.stats.getLevelByStat("pray") < this.prayers[i].level) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
                ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
            }
        }
    }

    HUD.prototype.setActivePrayers = function(activePrayers) {
        if (activePrayers)
            this.activePrayers = activePrayers;
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

        for (let i = 0; i < this.prayers.length; ++i) {
            if (this.prayers[i].rect.pointWithin(Game.mousePos)) {
                Game.ws.send({
                    id: Game.currentPlayer.id,
                    action: "toggle_prayer",
                    prayerId: this.prayers[i].id
                });
                break;
            }
        }
    }

    HUD.prototype.onMouseUp = function(e) {
     
    }

    HUD.prototype.onResize = function(newLeft) {
        this.rect.set(newLeft, this.rect.top, this.rect.width, this.rect.height);
        this.attackStyleButton.updateRect(this.rect);
        this.setPrayerRects(this.rect);
    }

    Game.HeadsUpDisplay = HUD;
}());