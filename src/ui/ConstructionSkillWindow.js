class ConstructionSkillWindowTab {
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
                action: `show_construction_skill_window`,
                tab: this.tabName,
                tileId: Game.currentPlayer.tileId
            });
        }
    }
}

class ConstructionSkillWindowItemSlot {
    constructor(dto) {
        const scenery = Game.sceneryMap.get(dto.resultingSceneryId);
        this.sceneryId = scenery.id;
        this.sceneryName = scenery.name;
        this.scenerySpriteFrame = SpriteManager.getSpriteFrameById(scenery.spriteFrameId);
        
        this.level = dto.level;
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

        this.scenerySpriteFrame.draw(context, this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height/2) + (this.scenerySpriteFrame.getCurrentFrame().height / 2));

        context.textAlign = "center";
        context.font = "12px customFont";
        context.fillStyle = "white";

        context.textBaseline = "top";

        let lineNum = 0;
        wordWrap(this.sceneryName, 15).split('\n').forEach(line => {
            context.fillText(wordWrap(line, 10), this.rect.left + (this.rect.width / 2), this.rect.top + 10 + (lineNum++ * 10));
        });

        context.textBaseline = "bottom";
        context.fillText(`level ${this.level}`, this.rect.left + (this.rect.width / 2), this.rect.bottom - 10);

        context.restore();
    }

    onMouseDown(e) {
        if (this.rect.pointWithin(Game.mousePos) && e.button === 2) { // right
            Game.ContextMenu.hide();
            Game.ContextMenu.push([{
                action: "show_construction_materials", 
                sceneryId: this.sceneryId,
                label: `materials for ${this.sceneryName}`
            }]);
        }
    }
}

class ConstructionSkillWindowItems {
    constructor(constructables) {
        this.constructables = [];
        constructables.sort((a, b) => a.level - b.level).forEach(constructable => this.constructables.push(new ConstructionSkillWindowItemSlot(constructable)));
    }

    setRect(x, y, w, h) {
        this.rect = new Rectangle(x, y, w, h);

        const itemWidth = 100;
        const itemsPerRow = ~~(w/itemWidth);
        const buffer = (w - (itemsPerRow * itemWidth)) / 2;
        for (let i = 0; i < this.constructables.length; ++i) {
            this.constructables[i].setRect(x + ((i % itemsPerRow) * itemWidth) + buffer, y + (~~(i/itemsPerRow) * itemWidth) + 20, itemWidth, itemWidth);
        }
    }

    draw(context) {
        this.constructables.forEach(constructable => constructable.draw(context));
    }

    onMouseDown(e) {
        this.constructables.forEach(constructable => constructable.onMouseDown(e));
    }
}

class ConstructionSkillWindow {
    constructor(worldRect, obj) {
        this.type = "constructionSkillWindow";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.name = "construction";

        console.log(obj);

        this.tabs = [];
        obj.tabs.forEach(name => this.tabs.push(new ConstructionSkillWindowTab(name)));

        this.selectedTab = obj.selectedTab;
        this.constructableWindow = new ConstructionSkillWindowItems(obj.constructables);
        
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
        this.constructableWindow.draw(context);

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

        if (this.constructableWindow.rect.pointWithin(Game.mousePos)) {
            this.constructableWindow.onMouseDown(e);
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

        this.constructableWindow.setRect(~~(uix + (uiWidth * 0.25)) + 0.5, uiy, ~~(uiWidth * 0.75), uiHeight);
    }
}