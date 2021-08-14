class MagicSkillWindowItemSlot {
    constructor(castableDto) {
        this.item = SpriteManager.getItemById(castableDto.itemId);
        this.level = castableDto.level;
        this.itemName = this.item.name.substr(0, this.item.name.lastIndexOf(" "));
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

        this.item.spriteFrame.draw(context, this.rect.left + (this.rect.width * 0.5), this.rect.top + (this.rect.height/2));

        context.textAlign = "center";
        context.font = "12px customFont";
        context.fillStyle = "white";

        context.textBaseline = "top";
        let lineNum = 0;
        wordWrap(this.itemName, 12).split('\n').forEach(line => {
            context.fillText(wordWrap(line, 10), this.rect.left + (this.rect.width / 2), this.rect.top + 10 + (lineNum++ * 10));
        });
        // context.fillText(this.itemName, this.rect.left + (this.rect.width / 2), this.rect.top + 10);

        context.textBaseline = "bottom";
        context.fillText(`level ${this.level}`, this.rect.left + (this.rect.width / 2), this.rect.bottom - 10);

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

class MagicSkillWindow {
    constructor(worldRect, obj) {
        this.type = "magicSkillWindow";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.name = "magic";

        console.log(obj);

        this.castables = [];
        obj.castables.sort((a, b) => a.level - b.level).forEach(castable => this.castables.push(new MagicSkillWindowItemSlot(castable)));
        
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
        context.fillText("- magic guide -", this.rect.left + (this.rect.width / 2), this.rect.top + 20);

        this.castables.forEach(castable => castable.draw(context));

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

        this.castables.forEach(castable => castable.onMouseDown(e));        
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

        const itemWidth = 80;
        const itemsPerRow = ~~(this.rect.width/itemWidth);
        const buffer = (this.rect.width - (itemsPerRow * itemWidth)) / 2;
        for (let i = 0; i < this.castables.length; ++i) {
            this.castables[i].setRect(this.rect.left + ((i % itemsPerRow) * itemWidth) + buffer, this.rect.top + (~~(i/itemsPerRow) * itemWidth) + 50, itemWidth, itemWidth);
        }
    }
}