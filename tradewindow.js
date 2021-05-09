(function() {
    function TradeWindow(rect, otherPlayerName) {
        this.type = "trade";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.otherPlayerName = otherPlayerName;
        this.playerSlots = [];
        this.otherSlots = [];

        this.playerAccepted = false;
        this.otherAccepted = false;
        
        this.acceptHover = false;

        this.onResize(rect);
    }

    TradeWindow.prototype.update = function(obj) {        
        // if items are added, then revert the acceptance
        this.playerAccepted = false;
        this.otherAccepted = false;
        
        this.playerSlots = [];
        for (let slot in obj.playerTradeData) {
            let playerSlot = new Game.TradeSlot(obj.playerTradeData[slot].itemId, obj.playerTradeData[slot].count, slot);
            let maxRows = ~~(this.playerRect.width / playerSlot.rect.width);

            let margin = ((this.playerRect.width - (maxRows * playerSlot.rect.width)) / 2);
            let currentRow = ~~(slot / maxRows);// four items per row
            let currentColumn = slot % maxRows;
            playerSlot.setLocalPosition(this.playerRect.left + margin + (currentColumn * playerSlot.rect.width), this.playerRect.top + 30 + (currentRow * playerSlot.rect.height));
            
            this.playerSlots.push(playerSlot);
        }

        this.otherSlots = [];
        for (let slot in obj.otherTradeData) {
            let otherSlot = new Game.TradeSlot(obj.otherTradeData[slot].itemId, obj.otherTradeData[slot].count, slot);
            let maxRows = ~~(this.otherRect.width / otherSlot.rect.width);

            let margin = ((this.otherRect.width - (maxRows * otherSlot.rect.width)) / 2);
            let currentRow = ~~(slot / maxRows);// four items per row
            let currentColumn = slot % maxRows;
            otherSlot.setLocalPosition(this.otherRect.left + margin + (currentColumn * otherSlot.rect.width), this.otherRect.top + 30 + (currentRow * otherSlot.rect.height));
            this.otherSlots.push(otherSlot);
        }

        this.playerAccepted = obj.playerAccepted;
        this.otherPlayerAccepted = obj.otherPlayerAccepted;
    }

    TradeWindow.prototype.draw = function(context, xview, yview) {
        context.save();
        context.fillStyle = this.background || "black";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.playerRect.left, this.playerRect.top, this.playerRect.width, this.playerRect.height);
        context.strokeRect(this.otherRect.left, this.otherRect.top, this.otherRect.width, this.otherRect.height);

        context.textBaseline = "top";
        context.textAlign = "center";
        context.font = "15px Consolas";
        context.fillStyle = "white";
        context.fillText(Game.currentPlayer.name, ~~(this.playerRect.left + (this.playerRect.width / 2)) + 0.5, ~~(this.playerRect.top + 10) + 0.5);
        context.fillText(this.otherPlayerName, ~~(this.otherRect.left + (this.otherRect.width / 2)) + 0.5, ~~(this.otherRect.top + 10) + 0.5);

        this.drawAcceptButton(context);

        for (let i = 0; i < this.playerSlots.length; ++i) {
            this.playerSlots[i].draw(context);
        }

        for (let i = 0; i < this.otherSlots.length; ++i) {
            this.otherSlots[i].draw(context);
        }

        if (this.playerAccepted) {
            context.textAlign = "center";
            context.font = "15px Consolas";
            context.fillStyle = "white";
            context.textBaseline = "middle";
            context.fillText("you have accepted.", 
                this.playerRect.left + ((this.playerRect.width - (this.acceptButtonRect.width / 2)) / 2),
                this.acceptButtonRect.top + (this.acceptButtonRect.height / 2));
        }

        if (this.otherAccepted) {
            context.textAlign = "center";
            context.font = "15px Consolas";
            context.fillStyle = "white";
            context.textBaseline = "middle";
            context.fillText(this.otherPlayerName + " has accepted.", 
                (this.otherRect.left + (this.acceptButtonRect.width / 2)) + ((this.otherRect.width - (this.acceptButtonRect.width / 2)) / 2),
                this.acceptButtonRect.top + (this.acceptButtonRect.height / 2));
        }
        
        context.restore();
    }

    TradeWindow.prototype.handleAccept = function(obj) {
        console.log(obj);
        console.log(Game.currentPlayer.id);
        for (let i = 0; i < obj.acceptedPlayerIds.length; ++i) {
            if (obj.acceptedPlayerIds[i] == Game.currentPlayer.id) {
                this.playerAccepted = true;
            } else {
                this.otherAccepted = true;
            }
        }
    }

    TradeWindow.prototype.drawAcceptButton = function(context) {
        context.save();
        context.fillStyle = this.acceptHover ? "#333" : "#000";
        context.fillRect(this.acceptButtonRect.left, this.acceptButtonRect.top, this.acceptButtonRect.width, this.acceptButtonRect.height);
        context.strokeRect(this.acceptButtonRect.left, this.acceptButtonRect.top, this.acceptButtonRect.width, this.acceptButtonRect.height);

        context.fillStyle = this.acceptHover ? "#0f0" : "#090";
        context.textAlign = "center";
        context.font = "25px Consolas";
        context.textBaseline = "middle";
        context.fillText("accept", this.acceptButtonRect.left + (this.acceptButtonRect.width / 2), this.acceptButtonRect.top + (this.acceptButtonRect.height / 2))
        context.restore();
    }

    TradeWindow.prototype.process = function(dt) {
        if (Game.ContextMenu.active)
            return;

        for (var i = 0; i < this.playerSlots.length; ++i) 
            this.playerSlots[i].process(dt);

        for (var i = 0; i < this.otherSlots.length; ++i) 
            this.otherSlots[i].process(dt);

        this.acceptHover = this.acceptButtonRect.pointWithin(Game.mousePos);
    }

    TradeWindow.prototype.onMouseDown = function(e) {
        if (e.button == 0) {// leftclick
            if (Game.ContextMenu.active) {
                Game.ContextMenu.handleMenuSelect();
                Game.ContextMenu.hide();
                this.selectedContextOption = true;
                return;
            }
        }

        // trade window
        if (this.acceptButtonRect.pointWithin(Game.mousePos)) {
            Game.ws.send({action: "accept_trade_offer"});
        } 
        else if (this.playerRect.pointWithin(Game.mousePos)) {
            for (var i = 0; i < this.playerSlots.length; ++i)
                this.playerSlots[i].onMouseDown(e);
        } 
        else if (this.otherRect.pointWithin(Game.mousePos)) {
            for (var i = 0; i < this.otherSlots.length; ++i)
                this.otherSlots[i].onMouseDown(e);
        } 
        // inventory so we can add stuff to trade window
        else if (Game.currentPlayer.inventory.rect.pointWithin(Game.mousePos) || 
            (Game.ContextMenu.active && Game.currentPlayer.inventory.rect.pointWithin(Game.ContextMenu.originalPos))) {
            Game.currentPlayer.inventory.onMouseDown(e.button);
        }
        else {
            Game.ws.send({action: "cancel_trade"});
            Game.activeUiWindow = null;
        }
    }

    TradeWindow.prototype.onMouseUp = function(e) {
        if (this.selectedContextOption) {
            this.selectedContextOption = false;
            return;
        }
        for (var i = 0; i < this.playerSlots.length; ++i) {
            this.playerSlots[i].onMouseUp(e);
        }

        for (var i = 0; i < this.otherSlots.length; ++i) {
            this.otherSlots[i].onMouseUp(e);
        }
    }

    TradeWindow.prototype.onMouseScroll = function(e) {
        
    }

    TradeWindow.prototype.onResize = function(worldRect) {
        let gameWindowWidth = worldRect.width;
        let uiWidth = gameWindowWidth / 1.25;
        let uiHeight = worldRect.height / 2;
        let uix = ~~((gameWindowWidth / 2) - (uiWidth / 2)) + 0.5;
        let uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;
        this.rect = new Game.Rectangle(uix, uiy, uiWidth, uiHeight);
        this.playerRect = new Game.Rectangle(this.rect.left, this.rect.top, this.rect.width/2, this.rect.height);
        this.otherRect = new Game.Rectangle(this.rect.left + this.rect.width/2, this.rect.top, this.rect.width/2, this.rect.height);
        this.acceptButtonRect = new Game.Rectangle(this.otherRect.left - 100, this.otherRect.top + this.otherRect.height - 50, 200, 40);

        for (let i = 0; i < this.playerSlots.length; ++i) {
            
            let maxRows = ~~(this.playerRect.width / this.playerSlots[i].rect.width);
            if (maxRows <= 0)
                continue;

            let margin = ((this.playerRect.width - (maxRows * this.playerSlots[i].rect.width)) / 2);
            let currentRow = ~~(i / maxRows);
            let currentColumn = i % maxRows;
            this.playerSlots[i].rect.setPos(this.playerRect.left + margin + (currentColumn * this.playerSlots[i].rect.width), this.playerRect.top + 30 + (currentRow * this.playerSlots[i].rect.height));
        }

        for (let i = 0; i < this.otherSlots.length; ++i) {
            let maxRows = ~~(this.otherRect.width / this.otherSlots[i].rect.width);
            if (maxRows <= 0)
                continue;

            let margin = ((this.otherRect.width - (maxRows * this.otherSlots[i].rect.width)) / 2);
            let currentRow = ~~(i / maxRows);
            let currentColumn = i % maxRows;
            this.otherSlots[i].rect.setPos(this.otherRect.left + margin + (currentColumn * this.otherSlots[i].rect.width), this.otherRect.top + 30 + (currentRow * this.otherSlots[i].rect.height));
        }
    }

    Game.TradeWindow = TradeWindow;
}());