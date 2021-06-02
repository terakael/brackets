(function() {
    function PotionWindow(worldRect, rows, name) {
        this.type = "potionwindow";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.name = name;
        this.rows = rows;

        this.icons = [];
        for (let i = 0; i < this.rows.length; ++i) {
            this.icons.push({
                result: {
                    item: Game.SpriteManager.getItemById(this.rows[i].itemId),
                    rect: new Game.Rectangle(0, 0, 32, 32)
                },
                mix: {
                    item: Game.SpriteManager.getItemById(this.rows[i].itemId2),
                    rect: new Game.Rectangle(0, 0, 32, 32)
                },
                secondary: {
                    item: Game.SpriteManager.getItemById(this.rows[i].itemId3),
                    rect: new Game.Rectangle(0, 0, 32, 32)
                }
            });
        }

        this.onResize(worldRect);
    }

    PotionWindow.prototype.draw = function(context, xview, yview) {
        context.save();
        context.fillStyle = this.background || "black";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        context.textAlign = "center";
        context.font = "15px customFont";
        context.fillStyle = "white";
        context.textBaseline = "middle";
        context.fillText(this.name, ~~(this.rect.left + (this.rect.width / 2)) + 0.5, ~~(this.rect.top + 10) + 0.5);

        for (let i = 0; i < this.icons.length; ++i) {
            let icon = this.icons[i];
            icon.result.item.draw(context, icon.result.rect.left + 16, icon.result.rect.top + 16);
            icon.mix.item.draw(context, icon.mix.rect.left + 16, icon.mix.rect.top + 16);
            icon.secondary.item.draw(context, icon.secondary.rect.left + 16, icon.secondary.rect.top + 16);
        }

        for (let i = 0; i < this.rows.length; ++i) {
            context.textAlign = "right";
            context.fillText(`${this.rows[i].level}:`, this.levelXPos, this.rect.top + 5 + ((i + 1) * 40));

            context.save()
            context.textAlign = "center";
            context.font = "25px customFont";
            context.fillText("=", this.equalsXPos, this.rect.top + 5 + ((i + 1) * 40));
            context.fillText("+", this.plusXPos, this.rect.top + 5 + ((i + 1) * 40));
            context.restore();
        }
        
        context.restore();
    }

    PotionWindow.prototype.process = function(dt) {
        if (Game.ContextMenu.active)
            return;
    }

    PotionWindow.prototype.onMouseDown = function(e) {

        switch (e.button) {
        case 0: {// leftclick
            if (Game.ContextMenu.active) {
                Game.ContextMenu.handleMenuSelect();
                Game.ContextMenu.hide();
                this.selectedContextOption = true;
                return;
            }
        }

        case 2: {// right:
            Game.ContextMenu.hide();
            for (let i = 0; i < this.icons.length; ++i) {
                if (this.icons[i].result.rect.pointWithin(Game.mousePos)) {
                    Game.ContextMenu.push([{
                        action: "examine",
                        objectName: this.icons[i].result.item.name,
                        objectId: this.icons[i].result.item.id,
                        type: "item"
                    }])
                }

                if (this.icons[i].mix.rect.pointWithin(Game.mousePos)) {
                    Game.ContextMenu.push([{
                        action: "examine",
                        objectName: this.icons[i].mix.item.name,
                        objectId: this.icons[i].mix.item.id,
                        type: "item"
                    }])
                }

                if (this.icons[i].secondary.rect.pointWithin(Game.mousePos)) {
                    Game.ContextMenu.push([{
                        action: "examine",
                        objectName: this.icons[i].secondary.item.name,
                        objectId: this.icons[i].secondary.item.id,
                        type: "item"
                    }])
                }
            }
        break;
        }
        }

        // potion window
        if (!this.rect.pointWithin(Game.mousePos)) {
            Game.activeUiWindow = null;
        }
    }

    PotionWindow.prototype.onMouseUp = function(e) {
        if (this.selectedContextOption) {
            this.selectedContextOption = false;
            return;
        }
    }

    PotionWindow.prototype.onMouseScroll = function(e) {
        
    }

    PotionWindow.prototype.onResize = function(worldRect) {
        let uiWidth = clamp(worldRect.width, 600, 1000) / 3;
        let uiHeight = (this.icons.length * 45);

        let uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;
        let uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;
        this.rect = new Game.Rectangle(uix, uiy, uiWidth, uiHeight);

        for (let i = 0; i < this.icons.length; ++i) {
            this.icons[i].result.rect.setPos(this.rect.left + (uiWidth * (2/7)) - 16, this.rect.top + 5 + ((i + 1) * 40) - 16);
            this.icons[i].mix.rect.setPos(this.rect.left + (uiWidth * (4/7)) - 16, this.rect.top + 5 + ((i + 1) * 40) - 16);
            this.icons[i].secondary.rect.setPos(this.rect.left + (uiWidth * (6/7)) - 16, this.rect.top + 5 + ((i + 1) * 40) - 16);
        }

        this.levelXPos = this.rect.left + (uiWidth * (1/7));
        this.plusXPos = this.rect.left + (uiWidth * (3/7));
        this.equalsXPos = this.rect.left + (uiWidth * (5/7));
    }

    Game.PotionWindow = PotionWindow;
}());