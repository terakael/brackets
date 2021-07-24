class ArtisanWindow {
    constructor(worldRect, artisanData) {
        this.type = "artisanwindow";// used to check which uiWindow is open (dialogue, smithing window etc)
        this.name = "artisan task";
        this.rows = [];
        this.artisanData = artisanData;
        this.totalTasks = 0;
        this.recursively((node, depth) => this.totalTasks += 1);

        this.onResize(worldRect);
    }

    draw(context) {
        context.save();
        context.fillStyle = this.background || "black";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        context.textAlign = "center";
        context.font = "17px customFont";
        context.fillStyle = "white";
        context.textBaseline = "middle";
        context.fillText(`- ${this.name} -`, ~~(this.rect.left + (this.rect.width / 2)) + 0.5, ~~(this.rect.top + 10) + 0.5);
        
        if (this.artisanData.length == 0) {
            context.textAlign = "center";
            context.font = "12px customFont";
            context.fillStyle = "#555";
            context.fillText("you are not currently assigned a task.", ~~(this.rect.left + (this.rect.width / 2)) + 0.5, ~~(this.rect.bottom - 15) + 0.5);
        } else {
            context.textAlign = "left";
            context.font = "20px customFont";
            let yOffset = this.rect.top + 50;
            this.recursively((node, depth) => {
                const {itemId, completedAmount, assignedAmount, childMaterial} = node;
                const x = this.rect.left + 10 + (32 * depth);
                const rect = new Rectangle(this.rect.left, yOffset - 16, this.rect.width, 32);

                const sprite = SpriteManager.getItemById(itemId);
                if (sprite)
                    sprite.draw(context, x, yOffset);

                const textColour = completedAmount === assignedAmount ? "green" : "white";
                context.fillStyle = rect.pointWithin(Game.mousePos) ? "yellow" : textColour;
                context.fillText(`${completedAmount}/${assignedAmount} completed`, x + 32, yOffset);

                yOffset += 32;
            });
        }
        
        context.restore();
    }

    recursively(fn) {
        for (let i = 0; i < this.artisanData.length; ++i)
            this.parseArtisanDataRecursively(this.artisanData[i], 1, fn);
    }

    parseArtisanDataRecursively(node, depth, fn) {
        fn(node, depth);
        node.childMaterial.forEach(material => this.parseArtisanDataRecursively(material, depth + 1, fn));
    }

    process(dt) {
        if (Game.ContextMenu.active)
            return;
    }

    onMouseDown(e) {

        switch (e.button) {
        case 0: {// leftclick
            if (Game.ContextMenu.active) {
                Game.ContextMenu.handleMenuSelect();
                Game.ContextMenu.hide();
                this.selectedContextOption = true;
                return;
            }
        }

        case 2: {// right:
            Game.ContextMenu.hide();

            let yOffset = this.rect.top + 50;
            this.recursively((node, depth) => {
                const rect = new Rectangle(this.rect.left, yOffset - 16, this.rect.width, 32);
                if (rect.pointWithin(Game.mousePos)) {
                    const sprite = SpriteManager.getItemById(node.itemId);
                    Game.ContextMenu.push([{
                        action: "examine",
                        objectName: sprite.name,
                        objectId: sprite.id,
                        type: "item"
                    }])
                }
                yOffset += 32;
            });
        break;
        }
        }

        if (!this.rect.pointWithin(Game.mousePos)) {
            Game.activeUiWindow = null;
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
        const uiWidth = clamp(worldRect.width, 300, 400);
        const uiHeight = (Math.max(1, this.totalTasks) * 32) + 32 + 10;

        const uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;
        const uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;
        this.rect = new Rectangle(uix, uiy, uiWidth, uiHeight);
    }
}