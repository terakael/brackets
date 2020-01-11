(function() {
    function PotionWindow(rect, rows, name) {
        this.type = "potionwindow";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.rect = rect;
        this.name = name;
        this.rows = rows;

        this.icons = [];
        for (let i = 0; i < this.rows.length; ++i) {
            this.icons.push({
                result: {
                    item: Game.SpriteManager.getItemById(this.rows[i].itemId),
                    rect: new Game.Rectangle(this.rect.left + 70 - 16, this.rect.top + 5 + ((i + 1) * 40) - 16, 32, 32)
                },
                mix: {
                    item: Game.SpriteManager.getItemById(this.rows[i].itemId2),
                    rect: new Game.Rectangle(this.rect.left + 170 - 16, this.rect.top + 5 + ((i + 1) * 40) - 16, 32, 32)
                },
                secondary: {
                    item: Game.SpriteManager.getItemById(this.rows[i].itemId3),
                    rect: new Game.Rectangle(this.rect.left + 270 - 16, this.rect.top + 5 + ((i + 1) * 40) - 16, 32, 32)
                }
            });
        }
    }

    PotionWindow.prototype.draw = function(context, xview, yview) {
        context.save();
        context.fillStyle = this.background || "black";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        context.textAlign = "center";
        context.font = "15px Consolas";
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
            context.fillText(`${this.rows[i].level}:`, this.rect.left + 50, this.rect.top + 5 + ((i + 1) * 40));

            context.save()
            context.textAlign = "center";
            context.font = "25px Consolas";
            context.fillText("=", this.rect.left + 120, this.rect.top + 5 + ((i + 1) * 40));
            context.fillText("+", this.rect.left + 220, this.rect.top + 5 + ((i + 1) * 40));
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
            // Game.ws.send({action: "close_bank"});
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

    Game.PotionWindow = PotionWindow;
}());