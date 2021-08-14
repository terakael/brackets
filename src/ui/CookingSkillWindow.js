class CookingSkillWindowItemSlot {
    constructor(cookingDto) {
        this.item = SpriteManager.getItemById(cookingDto.cookedItemId);
        this.level = cookingDto.level;
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
        context.fillText(this.item.name, this.rect.left + (this.rect.width / 2), this.rect.top + 10);

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

class CookingSkillWindow {
    constructor(worldRect, obj) {
        this.type = "cookingSkillWindow";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.name = "cooking";

        console.log(obj);

        this.cookables = [];
        obj.cookables.sort((a, b) => a.level - b.level).forEach(cookable => this.cookables.push(new CookingSkillWindowItemSlot(cookable)));
        
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
        context.fillText("- cooking guide -", this.rect.left + (this.rect.width / 2), this.rect.top + 20);

        this.cookables.forEach(cookable => cookable.draw(context));

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

        this.cookables.forEach(cookable => cookable.onMouseDown(e));        
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
        for (let i = 0; i < this.cookables.length; ++i) {
            this.cookables[i].setRect(this.rect.left + ((i % itemsPerRow) * itemWidth) + buffer, this.rect.top + (~~(i/itemsPerRow) * itemWidth) + 50, itemWidth, itemWidth);
        }
    }
}