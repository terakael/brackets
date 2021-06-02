(function() {
    function ShopWindow(worldRect, stock, name) {
        this.type = "shop";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.name = name;
        this.slots = [];
        this.updateStock(stock);
        this.onResize(worldRect);
    }

    ShopWindow.prototype.updateStock = function(stock) {
        this.slots = [];
        for (let slot in stock) {
            let shopSlot = new Game.ShopSlot(stock[slot].itemId, stock[slot].currentStock);
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
        context.font = "15px customFont";
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

    ShopWindow.prototype.onResize = function(worldRect) {
        let uiWidth = worldRect.width / 2;
        let uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;

        let maxRows = Math.max(~~(uiWidth / this.slots[0].rect.width), 1);
        let uiHeight = Math.max(Math.ceil(this.slots.length / maxRows), 2) * this.slots[0].rect.height + 30;
        let uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;

        this.rect = new Game.Rectangle(uix, uiy, uiWidth, uiHeight);

        for (let i = 0; i < this.slots.length; ++i) {
            let margin = ((this.rect.width - (maxRows * this.slots[i].rect.width)) / 2);
            let currentRow = ~~(i / maxRows);
            let currentColumn = i % maxRows;
            this.slots[i].rect.setPos(this.rect.left + margin + (currentColumn * this.slots[i].rect.width), this.rect.top + 30 + (currentRow * this.slots[i].rect.height));
        }

    }

    Game.ShopWindow = ShopWindow;
}());