class HouseInfoWindow {
    constructor(worldRect, obj) {
        this.type = "houseInfoWindow";// used to check which uiWindow is open (dialogue, smithing window etc)

        const houseInfo = obj.houseInfo;
        this.currentHouseId = houseInfo.id;
        this.name = houseInfo.name;
        this.size = houseInfo.size;
        this.requiredResources = houseInfo.requiredResources;
        this.isForSale = houseInfo.isForSale;
        this.currentImage = 0;

        this.showNextButton = obj.showNextButton;
        this.showPrevButton = obj.showPrevButton;

        console.log(obj);

        this.images = [];
        this.loadImages(houseInfo.mapsBase64 || [])

        this.onResize(worldRect);
    }

    loadImages = function(base64Array) {
        for (let base64 of base64Array) {
            let image = new Image();
            image.src = `data:image/png;base64,${base64}`;
            image.onload = () => this.images.push(image);
        }
    };

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
        context.fillText(`- ${this.name} -`, this.rect.left + (this.rect.width / 2), this.rect.top + 20);

        if (this.currentImage < this.images.length && this.images[this.currentImage]) {
            const img = this.images[this.currentImage];
            context.drawImage(img, 
                0, 0, img.width, img.height,
                this.imageRect.left, this.imageRect.top, this.imageRect.width, this.imageRect.height);
        }
        context.strokeRect(this.imageRect.left, this.imageRect.top, this.imageRect.width, this.imageRect.height);

        if (this.currentImage > 0)
            this.drawButton(context, this.prevImageButtonRect, "<-");
        
        if (this.currentImage < this.images.length - 1)
            this.drawButton(context, this.nextImageButtonRect, "->");        
        
        context.font = "15px customFont";
        context.fillText(`${this.currentImage + 1} / ${this.images.length}`, this.imageRect.left + (this.imageRect.width / 2), this.imageRect.bottom + 10);

        if (this.showPrevButton)
            this.drawButton(context, this.prevButtonRect, "prev");

        if (this.showNextButton)
            this.drawButton(context, this.nextButtonRect, "next");
        
        if (this.isForSale)
            this.drawButton(context, this.buyButtonRect, "buy");
        
        context.textAlign = "left";
        context.fillText(`size: ${this.size} tiles`, this.rect.left + 10, this.rect.bottom - 60);
        context.fillText(`required resources: ${this.requiredResources}`, this.rect.left + 10, this.rect.bottom - 80);

        if (!this.isForSale) {
            context.save();
            context.fillStyle = "rgba(0, 0, 0, 0.5)";
            context.fillRect(this.imageRect.left + 1, this.imageRect.top, this.imageRect.width - 1, this.imageRect.height - 1);
            
            context.textAlign = "center";
            context.fillStyle = "red";
            context.font = "70px customFont";
            context.fillText("sold", this.imageRect.left + (this.imageRect.width / 2), this.imageRect.top + (this.imageRect.height / 2));            
            context.restore();
        }

        context.restore();
    }

    drawButton(context, rect, text) {
        context.save();

        const isHover = rect.pointWithin(Game.mousePos);
        
        if (isHover) {
            context.fillStyle = "#222";
            context.fillRect(rect.left, rect.top, rect.width, rect.height);
        }

        context.strokeRect(rect.left, rect.top, rect.width, rect.height);

        context.fillStyle = "white";
        context.fillText(text, rect.left + (rect.width / 2), rect.top + (rect.height / 2));

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

        if (e.button === 0) {
            if (this.nextButtonRect.pointWithin(Game.mousePos)) {
                Game.ws.send({
                    action: `get_house_info`,
                    currentHouseId: this.currentHouseId,
                    direction: 2
                });
                return;
            }

            if (this.prevButtonRect.pointWithin(Game.mousePos)) {
                Game.ws.send({
                    action: `get_house_info`,
                    currentHouseId: this.currentHouseId,
                    direction: 1
                });
                return;
            }

            if (this.isForSale && this.buyButtonRect.pointWithin(Game.mousePos)) {
                Game.ws.send({
                    action: `buy_house`,
                    houseId: this.currentHouseId
                });
                return;
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
        const uiWidth = 300;
        const uiHeight = 400;

        const uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;
        const uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;
        this.rect = new Rectangle(uix, uiy, uiWidth, uiHeight);

        this.prevButtonRect = new Rectangle(this.rect.left + 10, this.rect.bottom - 10 - 30, 50, 30)
        this.nextButtonRect = new Rectangle(this.rect.right - 10 - 50, this.prevButtonRect.top, 50, 30)
        this.buyButtonRect = new Rectangle(this.prevButtonRect.right + 10, this.prevButtonRect.top, this.nextButtonRect.left - this.prevButtonRect.right - 20, 30);

        const imageRectWidth = this.rect.width - 20 - 20 - 60;
        this.imageRect = new Rectangle(this.rect.left + 20 + 30, this.rect.top + 10 + 30, imageRectWidth, imageRectWidth)
        
        this.prevImageButtonRect = new Rectangle(this.rect.left + 10, this.rect.top + 10 + 15 + (imageRectWidth / 2), 30, 30)
        this.nextImageButtonRect = new Rectangle(this.rect.right - 10 - 30, this.rect.top + 10 + 15 + (imageRectWidth / 2), 30, 30)
    }
}