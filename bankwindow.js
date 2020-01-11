(function() {
    function BankWindow(rect, stock, name) {
        this.type = "bank";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.rect = rect;
        this.name = name;
        this.slots = [];
        this.updateStock(stock);
    }

    BankWindow.prototype.updateStock = function(stock) {
        this.slots = [];
        for (let slot in stock) {
            let bankSlot = new Game.BankSlot(slot, stock[slot].itemId, stock[slot].count, stock[slot].charges);
            let currentRow = ~~(slot / 7);// seven items per row
            let currentColumn = slot % 7;
            bankSlot.setLocalPosition(this.rect.left + 20 + (currentColumn * 60), this.rect.top + 30 + (currentRow * 60));
            this.slots.push(bankSlot);
        }
    }

    BankWindow.prototype.draw = function(context, xview, yview) {
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

    BankWindow.prototype.process = function(dt) {
        if (Game.ContextMenu.active)
            return;

        for (var i = 0; i < this.slots.length; ++i) 
            this.slots[i].process(dt);
    }

    BankWindow.prototype.onMouseDown = function(e) {
        if (e.button == 0) {// leftclick
            if (Game.ContextMenu.active) {
                Game.ContextMenu.handleMenuSelect();
                Game.ContextMenu.hide();
                this.selectedContextOption = true;
                return;
            }
        }

        // bank window
        if (this.rect.pointWithin(Game.mousePos)) {
            for (var i = 0; i < this.slots.length; ++i)
                this.slots[i].onMouseDown(e);
        } 
        // inventory so we can deposit stuff
        else if (Game.currentPlayer.inventory.rect.pointWithin(Game.mousePos) || 
            (Game.ContextMenu.active && Game.currentPlayer.inventory.rect.pointWithin(Game.ContextMenu.originalPos))) {
            Game.currentPlayer.inventory.onMouseDown(e.button);
        }
        else {
            Game.ws.send({action: "close_bank"});
            Game.activeUiWindow = null;
        }
    }

    BankWindow.prototype.onMouseUp = function(e) {
        if (this.selectedContextOption) {
            this.selectedContextOption = false;
            return;
        }
        for (var i = 0; i < this.slots.length; ++i) {
            this.slots[i].onMouseUp(e);
        }
    }

    BankWindow.prototype.onMouseScroll = function(e) {
        
    }

    Game.BankWindow = BankWindow;
}());