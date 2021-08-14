class WoodcuttingSkillWindowItemSlot {
    constructor(woodcuttingDto) {
        // this.item = SpriteManager.getItemById(mineableDto.itemId);
        this.level = woodcuttingDto.level;

        const scenery = Game.sceneryMap.get(woodcuttingDto.sceneryId);
        this.sceneryId = scenery.id;
        this.sceneryName = scenery.name;
        this.scenerySpriteFrame = SpriteManager.getSpriteFrameById(scenery.spriteFrameId);
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

        this.scenerySpriteFrame.draw(context, this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height/2) + (this.scenerySpriteFrame.getCurrentFrame().height / 2));

        context.textAlign = "center";
        context.font = "12px customFont";
        context.fillStyle = "white";

        context.textBaseline = "top";
        context.fillText(this.sceneryName, this.rect.left + (this.rect.width / 2), this.rect.top + 5);

        context.textBaseline = "bottom";
        context.fillText(`level ${this.level}`, this.rect.left + (this.rect.width / 2), this.rect.bottom - 5);

        context.restore();
    }

    onMouseDown(e) {
        if (this.rect.pointWithin(Game.mousePos) && e.button === 2) { // right
            Game.ContextMenu.hide();
            Game.ContextMenu.push([{
                action: "examine",
                objectName: this.sceneryName,
                objectId: this.sceneryId,
                type: "scenery"
            }]);
        }
    }
}

class WoodcuttingSkillWindow {
    constructor(worldRect, obj) {
        this.type = "woodcuttingSkillWindow";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.name = "woodcutting";

        console.log(obj);

        this.choppables = [];
        obj.choppables.sort((a, b) => a.level - b.level).forEach(choppable => this.choppables.push(new WoodcuttingSkillWindowItemSlot(choppable)));
        
        this.onResize(worldRect);
    }

    draw(context) {
        context.save();
        context.fillStyle = "black";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        context.textAlign = "center";
        context.font = "20px customFont";
        context.fillStyle = "white";
        context.textBaseline = "middle";
        context.fillText("- woodcutting guide -", this.rect.left + (this.rect.width / 2), this.rect.top + 20);

        this.choppables.forEach(choppable => choppable.draw(context));

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

        this.choppables.forEach(choppable => choppable.onMouseDown(e));        
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
        const uiWidth = 300;
        const uiHeight = 400;

        const uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;
        const uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;
        this.rect = new Rectangle(uix, uiy, uiWidth, uiHeight);

        const itemWidth = 100;
        const itemsPerRow = ~~(this.rect.width/itemWidth);
        const buffer = (this.rect.width - (itemsPerRow * itemWidth)) / 2;
        for (let i = 0; i < this.choppables.length; ++i) {
            this.choppables[i].setRect(this.rect.left + ((i % itemsPerRow) * itemWidth) + buffer, this.rect.top + (~~(i/itemsPerRow) * itemWidth) + 50, itemWidth, itemWidth);
        }
    }
}