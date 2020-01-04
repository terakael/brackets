(function() {
    function ShopWindow(rect, stock, name) {
        this.type = "shop";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.rect = rect;
        this.name = name;
        this.slots = [];
        this.updateStock(stock);
    }

    ShopWindow.prototype.updateStock = function(stock) {
        this.slots = [];
        for (let slot in stock) {
            let shopSlot = new Game.ShopSlot(stock[slot].itemId, stock[slot].currentStock);
            let currentRow = ~~(slot / 4);// four items per row
            let currentColumn = slot % 4;
            shopSlot.setLocalPosition(this.rect.left + 20 + (currentColumn * 100), this.rect.top + 30 + (currentRow * 80));
            this.slots.push(shopSlot);
        }
    }

    ShopWindow.prototype.draw = function(context, xview, yview) {
        context.save();
        context.fillStyle = this.background || "black";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        context.textBaseline = "top";
        context.textAlign = "center";
        context.font = "15px Consolas";
        context.fillStyle = "white";
        context.fillText(this.name, ~~(this.rect.left + (this.rect.width / 2)) + 0.5, ~~(this.rect.top + 10) + 0.5);

        for (var i = 0; i < this.slots.length; ++i) {
            this.slots[i].draw(context);
        }
        
        context.restore();
    }

    ShopWindow.prototype.process = function(dt) {
        if (Game.ContextMenu.active)
            return;

        for (var i = 0; i < this.slots.length; ++i) 
            this.slots[i].process(dt);
    }

    ShopWindow.prototype.onMouseDown = function(e) {
        if (e.button == 0) {// leftclick
            if (Game.ContextMenu.active) {
                Game.ContextMenu.handleMenuSelect();
                Game.ContextMenu.hide();
                this.selectedContextOption = true;
                return;
            }
        }

        // shop window
        if (this.rect.pointWithin(Game.mousePos)) {
            for (var i = 0; i < this.slots.length; ++i)
                this.slots[i].onMouseDown(e);
        } 
        // inventory so we can sell stuff
        else if (Game.currentPlayer.inventory.rect.pointWithin(Game.mousePos) || 
            (Game.ContextMenu.active && Game.currentPlayer.inventory.rect.pointWithin(Game.ContextMenu.originalPos))) {
            Game.currentPlayer.inventory.onMouseDown(e.button);
        }
        else {
            Game.ws.send({action: "close_shop"});
            Game.activeUiWindow = null;
        }
    }

    ShopWindow.prototype.onMouseUp = function(e) {
        if (this.selectedContextOption) {
            this.selectedContextOption = false;
            return;
        }
        for (var i = 0; i < this.slots.length; ++i) {
            this.slots[i].onMouseUp(e);
        }
    }

    ShopWindow.prototype.onMouseScroll = function(e) {
        
    }

    Game.ShopWindow = ShopWindow;
}());