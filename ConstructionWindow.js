const ButtonStates = {
    off: 0,
    hover: 1,
    click: 2,
    disabled: 3
}


class ConstructionButton {
    constructor(dto, flatpack) {
        this.rect = new Rectangle(0, 0, 100, 75);

        if (Game.currentPlayer.stats.getLevelByStat("con") < dto.level)
            this.state = ButtonStates.disabled;
        else
            this.state = ButtonStates.off;
            
        this.constructableDto = dto;

        this.leftclickOption = {
            action: "construction", 
            sceneryId: this.constructableDto.resultingSceneryId,
            tileId: xyToTileId(~~Game.currentPlayer.x, ~~Game.currentPlayer.y),
            label: `build ${Game.sceneryMap.get(this.constructableDto.resultingSceneryId).name}`,
            flatpack
        }

        this.fillStyle = "#000";
        this.hoverFillStyle = "#222";
        this.clickFillStyle = "#444";

        this.strokeStyle = "#a00";
        this.hoverStrokeStyle = "#f00";
        this.clickStrokeSTyle = "#f00";
    }

    setLocalPosition(x, y) {
        this.rect.setPos(~~(this.rect.left + x) + 0.5, ~~(this.rect.top + y) + 0.5);
    }
    
    draw(context) {
        context.save();
        
        this.setFillStrokeStyle(context);
        context.lineWidth = 1;

        var buttonOffsetX = this.state === ButtonStates.click ? 2 : 0;
        var buttonOffsetY = this.state === ButtonStates.click ? 2 : 0;

        context.fillRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);

        context.textAlign = "right";
        context.textBaseline = "top";
        context.font = "12px customFont";
        context.fillStyle = Game.currentPlayer.stats.getLevelByStat("con") < this.constructableDto.level ? "red" : "white";

        // required smithing level
        context.fillText("lvl: " + this.constructableDto.level, this.rect.left + this.rect.width + buttonOffsetX - 5, this.rect.top + buttonOffsetY + 5);

        // draw the icon
        const drawSpriteframe = SpriteManager.getSpriteFrameById(Game.sceneryMap.get(this.constructableDto.resultingSceneryId).spriteFrameId);
        this.drawSpriteWithScale(context, drawSpriteframe, 1.5, 
            this.rect.left + (this.rect.width / 2) + buttonOffsetX, 
            this.rect.top + buttonOffsetY);

        context.textAlign = "left";
        context.textBaseline = "middle";
        context.font = "15px customFont";

        // TODO check if player has required materials; change fillstyle based on this
        context.fillStyle = "white";
        // draw the materials

        // draw from the right and then go left
        let rightmostOffset = 60;
        if (this.constructableDto.tertiaryAmount > 0) {
            const tertiaryItem = SpriteManager.getItemById(this.constructableDto.tertiaryId);
            var posx = this.rect.left + rightmostOffset + tertiaryItem.spriteFrame.getCurrentFrame().width / 2;
            var posy = this.rect.bottom - tertiaryItem.spriteFrame.getCurrentFrame().height / 2;

            this.drawSpriteWithScale(context, tertiaryItem.spriteFrame, 0.5, posx + buttonOffsetX + 5, posy + buttonOffsetY);
            context.fillText(` x${this.constructableDto.tertiaryAmount}`, posx + buttonOffsetX - 5, posy + 10 + buttonOffsetY);
            rightmostOffset -= 32;
        }

        if (this.constructableDto.barAmount > 0) {
            const bar = SpriteManager.getItemById(this.constructableDto.barId);
            var posx = this.rect.left + rightmostOffset + bar.spriteFrame.getCurrentFrame().width / 2;
            var posy = this.rect.bottom - bar.spriteFrame.getCurrentFrame().height / 2;
            
            this.drawSpriteWithScale(context, bar.spriteFrame, 0.5, posx + buttonOffsetX + 5, posy + buttonOffsetY);
            context.fillText(` x${this.constructableDto.barAmount}`, posx + buttonOffsetX - 5, posy + 10 + buttonOffsetY);
            rightmostOffset -= 32;
        }

        if (this.constructableDto.plankAmount > 0) {
            const plank = SpriteManager.getItemById(this.constructableDto.plankId);
            var posx = this.rect.left + rightmostOffset + plank.spriteFrame.getCurrentFrame().width / 2;
            var posy = this.rect.bottom - plank.spriteFrame.getCurrentFrame().height / 2;

            this.drawSpriteWithScale(context, plank.spriteFrame, 0.5, posx + buttonOffsetX + 5, posy + buttonOffsetY);
            context.fillText(` x${this.constructableDto.plankAmount}`, posx + buttonOffsetX - 5, posy + 10 + buttonOffsetY);
        }

        

        

        if (this.state === ButtonStates.disabled) {
            context.fillStyle = "rgba(50, 50, 50, 0.5)";
            context.fillRect(this.rect.left + buttonOffsetX, this.rect.top + buttonOffsetY, this.rect.width, this.rect.height);
        }
        
        context.restore();
    }

    drawSpriteWithScale(context, spriteFrame, scale, x, y) {
        const itemWidth = spriteFrame.getCurrentFrame().width;
        const itemHeight = spriteFrame.getCurrentFrame().height;

        const currentFrame = spriteFrame.getCurrentFrame();
        const {spriteMapId, color} = spriteFrame;
        const spriteMap = SpriteManager.getSpriteMapById(spriteMapId, color);
        if (spriteMap) {
            context.drawImage(spriteMap, 
                currentFrame.left, 
                currentFrame.top, 
                currentFrame.width, 
                currentFrame.height, 
                x - (itemWidth * scale), 
                y, 
                itemWidth * scale, 
                itemHeight * scale);
        }
    }

    setFillStrokeStyle(context) {
        switch (this.state) {
            case ButtonStates.hover:
                context.fillStyle = this.hoverFillStyle;
                context.strokeStyle = this.hoverStrokeStyle;
                break;
            case ButtonStates.click:
                context.fillStyle = this.clickFillStyle;
                context.strokeStyle = this.strokeFillStyle;
                break;
            default:
                context.fillStyle = this.fillStyle;
                context.strokeStyle = this.strokeStyle;
                break;
        }
    }

    process(dt) {
        if (this.state === ButtonStates.disabled)
            return;

        if(this.rect.pointWithin(Game.mousePos)) {
            if (this.state !== ButtonStates.click) 
                this.state = ButtonStates.hover;
            
            Game.ContextMenu.setLeftclick(Game.mousePos, this.leftclickOption);
        } else {
            this.state = ButtonStates.off;
        }
    }

    onMouseDown(e) {
        if (this.state === ButtonStates.disabled)
            return;
    
        if (this.rect.pointWithin(Game.mousePos)) {
            if (e.button === 0) { // left
                this.state = ButtonStates.click;
            } else if (e.button === 2) { // right
                Game.ContextMenu.hide();// clear all the previous actions
                // context options
                Game.ContextMenu.push([this.leftclickOption, {
                    action: "show_construction_materials", 
                    sceneryId: this.constructableDto.resultingSceneryId,
                    label: `materials for ${Game.sceneryMap.get(this.constructableDto.resultingSceneryId).name}`
                }]);
            }
        }
    }

    onMouseUp(e) {
        if (this.state === ButtonStates.disabled)
            return;

        if (e.button === 0 && this.state === ButtonStates.click) {
            this.state = ButtonStates.off;

            Game.ws.send(this.leftclickOption);

            // close the window
            Game.activeUiWindow = null;
        }
    }
}

class ConstructionWindow {
    constructor(rect, constructableDtoList, isFlatpack) {
        this.rect = rect;
        
        let buttons = [];
        for (let i = 0; i < constructableDtoList.length; ++i) {
            buttons.push(new ConstructionButton(constructableDtoList[i], isFlatpack));
        }
        this.uiButtons = buttons.sort((a, b) => a.constructableDto.level - b.constructableDto.level);
        this.onResize(rect);
    }
    
    draw(context) {
        context.save();
        context.fillStyle = this.background || "black";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        context.textAlign = "center";
        context.fillStyle = "white";

        var y = this.rect.top + 20;
        context.fillText("- select which item you want to build -", this.rect.left + (this.rect.width / 2), y);
        
        this.uiButtons.forEach(e => e.draw(context));
        context.restore();
    }

    process(dt) {
        if (Game.ContextMenu.active)
            return;
        this.uiButtons.forEach(e => e.process(dt));
    }

    onMouseDown(e) {
        if (e.button == 0) {// leftclick
            if (Game.ContextMenu.active) {
                const menuItem = Game.ContextMenu.handleMenuSelect();
                Game.ContextMenu.hide();
                if (menuItem.action === "construction")
                    Game.activeUiWindow = null; // keep the window open for the show materials option
                return;
            }
        }

        if (this.rect.pointWithin(Game.mousePos)) {
            this.uiButtons.forEach(button => button.onMouseDown(e));
        } else {
            Game.activeUiWindow = null;
        }
    }

    onMouseUp(e) {
        this.uiButtons.forEach(button => button.onMouseUp(e));
    }

    onMouseScroll(e) {
        
    }

    onResize(worldRect) {
        let uiWidth = worldRect.width / 2;
        let uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;

        const slotRectWidth = this.uiButtons[0].rect.width;
        const slotRectHeight = this.uiButtons[0].rect.height;

        let maxRows = Math.max(~~(uiWidth / (slotRectWidth + 10)), 1);
        let uiHeight = Math.max(Math.ceil(this.uiButtons.length / maxRows), 2) * (slotRectHeight + 10) + 50;
        let uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;

        this.rect = new Rectangle(uix, uiy, uiWidth, uiHeight);
        
        let margin = ((this.rect.width - (maxRows * (slotRectWidth + 10))) / 2);
        for (let i = 0; i < this.uiButtons.length; ++i) {
            let currentRow = ~~(i / maxRows);
            let currentColumn = i % maxRows;
            this.uiButtons[i].rect.setPos(this.rect.left + margin + (currentColumn * (slotRectWidth + 10)), this.rect.top + 30 + (currentRow * (slotRectHeight + 10)));
        }
    }
}