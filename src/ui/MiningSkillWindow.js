class MiningSkillWindowItemSlot {
    constructor(mineableDto) {
        // this.item = SpriteManager.getItemById(mineableDto.itemId);
        this.level = mineableDto.level;

        const scenery = Game.sceneryMap.get(mineableDto.sceneryId);
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
        context.fillText(this.sceneryName, this.rect.left + (this.rect.width / 2), this.rect.top + 10);

        context.textBaseline = "bottom";
        context.fillText(`level ${this.level}`, this.rect.left + (this.rect.width / 2), this.rect.bottom - 10);

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

class MiningSkillWindow {
    constructor(worldRect, obj) {
        this.type = "miningSkillWindow";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.name = "mining";

        console.log(obj);

        this.mineables = [];
        obj.mineables.sort((a, b) => a.level - b.level).forEach(mineable => this.mineables.push(new MiningSkillWindowItemSlot(mineable)));
        
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
        context.fillText("- mining guide -", this.rect.left + (this.rect.width / 2), this.rect.top + 20);

        this.mineables.forEach(mineable => mineable.draw(context));

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

        this.mineables.forEach(mineable => mineable.onMouseDown(e));        
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
        const uiWidth = clamp(worldRect.width / 2, 200, 300);
        const uiHeight = clamp(worldRect.height / 2, 300, 400);

        const uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;
        const uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;
        this.rect = new Rectangle(uix, uiy, uiWidth, uiHeight);

        const itemWidth = 80;
        const itemsPerRow = ~~(this.rect.width/itemWidth);
        const buffer = (this.rect.width - (itemsPerRow * itemWidth)) / 2;
        for (let i = 0; i < this.mineables.length; ++i) {
            this.mineables[i].setRect(this.rect.left + ((i % itemsPerRow) * itemWidth) + buffer, this.rect.top + (~~(i/itemsPerRow) * itemWidth) + 50, itemWidth, itemWidth);
        }
    }
}