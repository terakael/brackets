class ArtisanShopTabs {
    constructor(tabName) {
        this.tabName = tabName;
    }

    setRect(x, y, w, h) {
        this.rect = new Rectangle(x, y, w, h);
    }

    draw(context, isActiveTab) {
        const isHover = this.rect.pointWithin(Game.mousePos);

        context.save();
        if (!isActiveTab) {
            context.strokeStyle = "red";
            context.lineWidth = isHover ? 3 : 1;

            context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
            context.fillStyle = "#111";
            context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

            if (isHover) {
                context.fillStyle = "#222";
                context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
            }
        }

        context.textAlign = "center";
        context.font = "17px customFont";
        context.textBaseline = "middle";
        context.fillStyle = isActiveTab ? "red" : "white";
        context.fillText(this.tabName, this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height / 2));
        context.restore();
    }

    onMouseDown() {
        if (this.rect.pointWithin(Game.mousePos)) {
            Game.ws.send({
                action: `switch_artisan_shop_tab`,
                tabName: this.tabName,
                tileId: Game.currentPlayer.tileId
            });
        }
    }
}

class ArtisanTasksShopSlot {
    constructor(taskOption) {
        this.taskOption = taskOption;
    }

    setRect(x, y, w, h) {
        this.rect = new Rectangle(x, y, w, h);
    }

    draw(context) {
        context.save();

        context.strokeStyle = "red";
        context.lineWidth = this.rect.pointWithin(Game.mousePos) ? 3 : 1;
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        
        context.fillStyle = "white";
        context.textAlign = "center";
        context.font = "12px customFont";
        context.textBaseline = "middle";
        context.fillText(this.taskOption.name, this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height / 2));

        context.restore();
    }

    onMouseDown() {

    }
}

class ArtisanTasksShop {
    constructor(taskOptions) {
        this.tabName = "task";
        this.taskOptions = [];
        taskOptions.forEach(taskOption => this.taskOptions.push(new ArtisanTasksShopSlot(taskOption)));
    }

    setRect(x, y, w, h) {
        this.rect = new Rectangle(x, y, w, h);

        for (let i = 0; i < this.taskOptions.length; ++i) {
            this.taskOptions[i].setRect(this.rect.left + ((i%2) * this.rect.width/2), this.rect.top + 30 + (~~(i/2) * 45), this.rect.width / 2, 45);
        }
    }

    draw(context) {
        context.save();

        context.textAlign = "center";
        context.font = "17px customFont";
        context.textBaseline = "middle";
        context.fillStyle = "white";

        this.taskOptions.forEach(option => option.draw(context));
        
        context.restore();
    }
}

class ArtisanEnhanceShopSlot {
    constructor(item) {
        this.item = item;
    }

    setRect(x, y, w, h) {
        this.rect = new Rectangle(x, y, w, h);
    }

    draw(context) {
        context.save();

        const drawItem = SpriteManager.getItemById(this.item.itemId);
        if (drawItem) {
            drawItem.spriteFrame.draw(context, this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height / 2));
        }
        context.restore();
    }
}

class ArtisanEnhanceShop {
    constructor(enhanceableItems) {
        this.tabName = "enhance";
        this.enhanceableItems = [];
        enhanceableItems.forEach(item => this.enhanceableItems.push(new ArtisanEnhanceShopSlot(item)));
    }

    setRect(x, y, w, h) {
        this.rect = new Rectangle(x, y, w, h);
        // for (let i = 0; i < this.enhanceableItems.length; ++i) {
        //     this.enhanceableItems[i].setRect(this.rect.left + ((i * 60) + 5) + 40, this.rect.top + 5 + 16 + 20, 32, 32);
        // }

        const itemWidth = 60;
        const itemsPerRow = ~~(w/itemWidth);
        const buffer = (w - (itemsPerRow * itemWidth)) / 2;
        for (let i = 0; i < this.enhanceableItems.length; ++i) {
            this.enhanceableItems[i].setRect(x + ((i % itemsPerRow) * itemWidth) + buffer, y + (~~(i/itemsPerRow) * itemWidth) + 20, itemWidth, itemWidth);
        }
    }

    draw(context) {
        context.save();

        context.textAlign = "center";
        context.font = "17px customFont";
        context.textBaseline = "middle";
        context.fillStyle = "white";
        context.fillText("enhance", this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height / 2));

        this.enhanceableItems.forEach(item => item.draw(context));
        
        context.restore();
    }
}

class ArtisanItemShopSlot {
    constructor(itemId, numPoints) {
        this.item = SpriteManager.getItemById(itemId);
        this.numPoints = numPoints;

        this.leftclickOption = {
            id: Game.currentPlayer.id,
            action: "buy_artisan_stock", 
            itemId: this.item.id,
            label: `buy ${this.item.name}`,
            tileId: Game.currentPlayer.getTileId()
        }
    }

    setRect(x, y, w, h) {
        this.rect = new Rectangle(x, y, w, h);
    }

    draw(context) {
        context.save();

        if (this.rect.pointWithin(Game.mousePos)) {
            context.fillStyle = "#111";
            context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
            Game.ContextMenu.setLeftclick(Game.mousePos, this.leftclickOption);
        }

        // context.strokeStyle = "red";
        // context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        this.item.spriteFrame.draw(context, this.rect.left + (this.rect.width/2), this.rect.top + (this.rect.height/2));

        context.textAlign = "center";
        context.font = "12px customFont";
        context.fillStyle = "white";

        context.textBaseline = "top";
        context.fillText(this.item.name, this.rect.left + (this.rect.width / 2), this.rect.top);

        context.textBaseline = "bottom";
        context.fillText(`${this.numPoints} points`, this.rect.left + (this.rect.width / 2), this.rect.bottom);

        context.restore();
    }

    onMouseDown(e) {
        switch (e.button) {
        case 0: // left
            if (!Game.ContextMenu.active)
                Game.ws.send(this.leftclickOption);
            break;

        case 2: // right
            Game.ContextMenu.hide();// clear all the previous actions
            Game.ContextMenu.push([this.leftclickOption]);
            
            Game.ContextMenu.push([{
                id: Game.currentPlayer.id,
                action: "examine", 
                objectName: this.item.name,
                objectId: this.item.id,
                type: "item"
            }]);
            
            break;
        }
    }
}

class ArtisanItemShop {
    constructor(stock) {
        this.tabName = "shop";
        this.shopStock = [];
        
        console.log(stock);
        for (const [itemId, numPoints] of Object.entries(stock)) {
            this.shopStock.push(new ArtisanItemShopSlot(Number(itemId), Number(numPoints)));
        }

        // while (this.shopStock.length < 30)
        //     this.shopStock.push(new ArtisanItemShopSlot(0, 0));
    }

    setRect(x, y, w, h) {
        this.rect = new Rectangle(x, y, w, h);

        const itemWidth = 60;
        const itemsPerRow = ~~(w/itemWidth);
        const buffer = (w - (itemsPerRow * itemWidth)) / 2;
        for (let i = 0; i < this.shopStock.length; ++i) {
            this.shopStock[i].setRect(x + ((i % itemsPerRow) * itemWidth) + buffer, y + (~~(i/itemsPerRow) * itemWidth) + 20, itemWidth, itemWidth);
        }
    }

    draw(context) {
        context.save();        
        
        this.shopStock.forEach(stock => stock.draw(context));

        if (this.shopStock.length == 0) {
            context.textAlign = "center";
            context.font = "17px customFont";
            context.textBaseline = "middle";
            context.fillStyle = "white";
            context.fillText("no items available.", this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height / 2));
        }
        
        context.restore();
    }

    onMouseDown(e) {
        this.shopStock.forEach(stock => {
            if (stock.rect.pointWithin(Game.mousePos))
                stock.onMouseDown(e);
        });
    }
}

class ArtisanShop {
    constructor(worldRect, obj) {
        this.type = "artisanshop";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.name = "alaina's artisanry";
        this.points = obj.points;

        console.log(obj);

        this.tabs = [];
        obj.tabs.forEach(name => this.tabs.push(new ArtisanShopTabs(name)));

        switch (obj.selectedTab) {
            case "enhance":
                this.selectedShop = new ArtisanEnhanceShop(obj.enhanceableItems);
                break;

            case "shop":
                this.selectedShop = new ArtisanItemShop(obj.shopStock);
                break;

            case "task": // fall through
            default:
                this.selectedShop = new ArtisanTasksShop(obj.taskOptions);
                break;
        }
        
        this.onResize(worldRect);
    }

    draw(context) {
        context.save();
        context.fillStyle = this.background || "black";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);


        this.tabs.forEach(tab => tab.draw(context, this.selectedShop.tabName === tab.tabName));
        this.selectedShop.draw(context);

        context.textAlign = "right";
        context.font = "17px customFont";
        context.textBaseline = "top";
        context.fillStyle = "white";
        context.fillText(`points: ${this.points}`, this.rect.right - 5, this.rect.top + 5);
        
        context.restore();
    }

    process(dt) {
        if (Game.ContextMenu.active)
            return;
    }

    onMouseDown(e) {
        if (!this.rect.pointWithin(Game.mousePos)) {
            Game.activeUiWindow = null;
            return;
        }
        
        if (e.button === 0 && Game.ContextMenu.active) {
            Game.ContextMenu.handleMenuSelect();
            Game.ContextMenu.hide();
            this.selectedContextOption = true;
            return;
        }

        if (this.selectedShop.rect.pointWithin(Game.mousePos)) {
            this.selectedShop.onMouseDown(e);
            return;
        }

        switch (e.button) {
        case 0: {// leftclick
            this.tabs.forEach(tab => tab.onMouseDown());
        }

        case 2: {// right:
            Game.ContextMenu.hide();
        break;
        }
        }

        
    }

    onMouseUp(e) {
        if (this.selectedContextOption) {
            this.selectedContextOption = false;
            return;
        }
    }

    onMouseScroll(e) {
        
    }

    onResize(worldRect) {
        const uiWidth = clamp(worldRect.width / 2, 500, 600);
        const uiHeight = clamp(worldRect.height / 2, 300, 400);

        const uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;
        const uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;
        this.rect = new Rectangle(uix, uiy, uiWidth, uiHeight);

        if (this.tabs.length > 0) {
            const tabHeight = (uiHeight / this.tabs.length);
            for (let i = 0; i < this.tabs.length; ++i) {
                this.tabs[i].setRect(uix, ~~(uiy + (i * tabHeight)) + 0.5, ~~(uiWidth * 0.25), tabHeight);
            }
        }

        this.selectedShop.setRect(~~(uix + (uiWidth * 0.25)) + 0.5, uiy, ~~(uiWidth * 0.75), uiHeight);
    }
}