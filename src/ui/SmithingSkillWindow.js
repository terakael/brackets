class SmithingSkillWindowTab {
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
                action: `show_smithing_skill_window`,
                tab: this.tabName,
                tileId: Game.currentPlayer.tileId
            });
        }
    }
}

class SmithingSkillWindowItemSlot {
    constructor(itemId, requiredLevel, barId, requiredBars) {
        this.item = SpriteManager.getItemById(itemId);
        this.level = requiredLevel;
        this.itemName = this.item.name.substr(this.item.name.indexOf(" ") + 1);
        this.requiredBars = requiredBars;
        this.bar = SpriteManager.getItemById(barId);
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

        this.bar.spriteFrame.draw(context, this.rect.left + (this.rect.width * 0.65), this.rect.top + (this.rect.height * 0.45));
        this.item.spriteFrame.draw(context, this.rect.left + (this.rect.width * 0.35), this.rect.top + (this.rect.height/2));

        context.textAlign = "center";
        context.font = "12px customFont";
        context.fillStyle = "white";

        context.textBaseline = "top";
        context.fillText(this.itemName, this.rect.left + (this.rect.width / 2), this.rect.top + 10);

        context.textBaseline = "bottom";
        context.fillText(`level ${this.level}`, this.rect.left + (this.rect.width / 2), this.rect.bottom - 10);
        context.fillText(`x${this.requiredBars}`, this.rect.left + (this.rect.width * 0.65), this.rect.top + (this.rect.height * 0.65));

        context.restore();
    }

    onMouseDown(e) {
        if (this.rect.pointWithin(Game.mousePos) && e.button === 2) { // right
            Game.ContextMenu.hide();
            Game.ContextMenu.push([{
                action: "examine",
                objectName: this.item.name,
                objectId: this.item.id,
                type: "item"
            }]);
        }
    }
}

class SmithingSkillWindowItems {
    constructor(items) {
        this.items = [];
        items.sort((a, b) => a.level - b.level).forEach(item => this.items.push(new SmithingSkillWindowItemSlot(item.itemId, item.level, item.barId, item.requiredBars)));
    }

    setRect(x, y, w, h) {
        this.rect = new Rectangle(x, y, w, h);

        const itemWidth = 80;
        const itemsPerRow = ~~(w/itemWidth);
        const buffer = (w - (itemsPerRow * itemWidth)) / 2;
        for (let i = 0; i < this.items.length; ++i) {
            this.items[i].setRect(x + ((i % itemsPerRow) * itemWidth) + buffer, y + (~~(i/itemsPerRow) * itemWidth) + 20, itemWidth, itemWidth);
        }
    }

    draw(context) {
        this.items.forEach(item => item.draw(context));
    }

    onMouseDown(e) {
        this.items.forEach(item => item.onMouseDown(e));
    }
}

class SmithingSkillWindow {
    constructor(worldRect, obj) {
        this.type = "smithingSkillWindow";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.name = "smithing";

        console.log(obj);

        this.tabs = [];
        obj.tabs.forEach(name => this.tabs.push(new SmithingSkillWindowTab(name)));

        this.selectedTab = obj.selectedTab;
        this.itemWindow = new SmithingSkillWindowItems(obj.smithables);
        
        this.onResize(worldRect);
    }

    draw(context) {
        context.save();
        context.fillStyle = "black";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        this.tabs.forEach(tab => tab.draw(context, this.selectedTab === tab.tabName));
        this.itemWindow.draw(context);

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

        if (this.itemWindow.rect.pointWithin(Game.mousePos)) {
            this.itemWindow.onMouseDown(e);
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

        this.itemWindow.setRect(~~(uix + (uiWidth * 0.25)) + 0.5, uiy, ~~(uiWidth * 0.75), uiHeight);
    }
}