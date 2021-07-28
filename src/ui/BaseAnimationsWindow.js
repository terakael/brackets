class BaseAnimationSwitcher {    
    constructor(name, animation, defaultColor, onColorChange) {
        this.name = name;
        this.leftArrowPressed = false;
        this.rightArrowPressed = false;
        this.animation = animation;
        this.color = decToHexColor(defaultColor);
        this.onColorChange = onColorChange;
    }

    setAnimation(animation) {
        this.animation = animation;
    }

    setColor(color) {
        this.color = decToHexColor(color);
    }

    setPos(x, y) {
        const arrowButtonLength = 32;
        const nameRectLength = 70;
        const controlHeight = 32;
        
        this.mainRect = new Rectangle(x, y, (arrowButtonLength * 2) + nameRectLength, controlHeight); // 32x32 arrow buttons on each side, with 70px for the name in the middle
        this.leftArrowRect = new Rectangle(x, y, arrowButtonLength, controlHeight);
        this.nameRect = new Rectangle(this.leftArrowRect.right, y, nameRectLength, controlHeight);
        this.rightArrowRect = new Rectangle(this.nameRect.right, y, arrowButtonLength, controlHeight);
        this.colorRect = new Rectangle(this.rightArrowRect.right + 10, y, 100, 32);
    }

    draw(context) {
        context.strokeStyle = "red";
        context.strokeRect(this.leftArrowRect.left, this.leftArrowRect.top, this.leftArrowRect.width, this.leftArrowRect.height);
        if (this.leftArrowRect.pointWithin(Game.mousePos)) {
            context.fillStyle = "red";
            context.fillRect(this.leftArrowRect.left, this.leftArrowRect.top, this.leftArrowRect.width, this.leftArrowRect.height);
        }
        
        context.strokeRect(this.rightArrowRect.left, this.rightArrowRect.top, this.rightArrowRect.width, this.rightArrowRect.height);
        if (this.rightArrowRect.pointWithin(Game.mousePos)) {
            context.fillStyle = "red";
            context.fillRect(this.rightArrowRect.left, this.rightArrowRect.top, this.rightArrowRect.width, this.rightArrowRect.height);
        }

        context.strokeRect(this.colorRect.left, this.colorRect.top, this.colorRect.width, this.colorRect.height);
        if (this.colorRect.pointWithin(Game.mousePos)) {
            context.fillStyle = "red";
            context.fillRect(this.colorRect.left, this.colorRect.top, this.colorRect.width, this.colorRect.height);
        }

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "20px customFont";
        context.fillStyle = "white";
        context.fillText("<-", this.leftArrowRect.left + (this.leftArrowRect.width / 2), this.leftArrowRect.top + (this.leftArrowRect.height / 2));
        context.fillText("->", this.rightArrowRect.left + (this.rightArrowRect.width / 2), this.rightArrowRect.top + (this.rightArrowRect.height / 2));
        context.fillText(this.name, this.nameRect.left + (this.nameRect.width / 2), this.nameRect.top + (this.nameRect.height / 2));
        context.fillText(this.color, this.colorRect.left + (this.colorRect.width / 2), this.colorRect.top + (this.colorRect.height / 2));
    }

    onMouseDown(e) {
        if (e.button !== 0)
            return;

        this.leftArrowPressed = this.leftArrowRect.pointWithin(Game.mousePos);
        this.rightArrowPressed = this.rightArrowRect.pointWithin(Game.mousePos);
        this.colorRectPressed = this.colorRect.pointWithin(Game.mousePos);
    }

    onMouseUp(e) {
        if (e.button !== 0)
            return;
        
        if (this.leftArrowRect.pointWithin(Game.mousePos) && this.leftArrowPressed) {
            Game.ws.send({
                action: "cycle_base_animation",
                direction: "previous",
                part: this.name,
                currentlyDisplayedUpId: this.animation.up,
                color: this.animation.color
            });
        } else if (this.rightArrowRect.pointWithin(Game.mousePos) && this.rightArrowPressed) {
            Game.ws.send({
                action: "cycle_base_animation",
                direction: "next",
                part: this.name,
                currentlyDisplayedUpId: this.animation.up,
                color: this.animation.color
            });
        } else if (this.colorRect.pointWithin(Game.mousePos) && this.colorRectPressed) {
            // change colour, probs don't need to send a message to the server for this
            ChatBox.requireInput("set color", /[0-9A-Fa-f]/).then(hex => {
                const validatedHex = hex.substring(0, 6).toLowerCase();
                this.color = `#${validatedHex}`;
                this.animation.color = parseInt(validatedHex, 16);
                this.onColorChange(this.name.toUpperCase(), this.animation);
            });
        }
        
        this.leftArrowPressed = false;
        this.rightArrowPressed = false;
        this.colorRectPressed = false;
    }
}

class BaseAnimationsWindow {
    constructor(rect, baseAnimations, customizableAnimations) {
        this.rect = rect;
        this.saveButtonPressed = false;
        
        this.samplePlayer = new Game.Player({id: -1, name: "", tileId: -1, combatLevel: -1, currentHp: -1, maxHp: -1});
        this.samplePlayer.setAnimations({...customizableAnimations, ...baseAnimations});

        this.switchers = new Map();
        this.colorBars = new Map();
        
        for (let part in customizableAnimations) {
            this.switchers.set(part, 
                new BaseAnimationSwitcher(part.toLowerCase(), 
                    customizableAnimations[part], 
                    customizableAnimations[part]["color"] || 0, 
                    (part, animation) => this.samplePlayer.setAnimation(part, animation)));
        }

        this.onResize(rect);
    }

    cycleAnimation(part, animation) {
        if (this.switchers.has(part)) {
            this.switchers.get(part).setAnimation(animation);

            this.samplePlayer.setAnimation(part, animation);
        }
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
        context.fillText("- character configuration -", this.rect.left + (this.rect.width / 2), y);

        const scale = 5;
        context.save();
        const transform = new Transform();
        transform.scale(scale, scale);
        context.setTransform.apply(context, transform.m);
        this.samplePlayer.getCurrentSpriteFrames().forEach(frame => {
            frame.draw(context, 
                ((this.rect.right - 10) / scale) - (frame.getCurrentFrame().width / 2),
                ((this.rect.top + (this.rect.height / 2)) / scale) + (frame.getCurrentFrame().height / 2));
        });
        context.restore();

        this.switchers.forEach(switcher => switcher.draw(context));

        context.strokeStyle = "red";
        context.strokeRect(this.saveButtonRect.left, this.saveButtonRect.top, this.saveButtonRect.width, this.saveButtonRect.height);
        if (this.saveButtonRect.pointWithin(Game.mousePos)) {
            context.fillStyle = "red";
            context.fillRect(this.saveButtonRect.left, this.saveButtonRect.top, this.saveButtonRect.width, this.saveButtonRect.height);
        }
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "20px customFont";
        context.fillStyle = "white";
        context.fillText("save", this.saveButtonRect.left + (this.saveButtonRect.width / 2), this.saveButtonRect.top + (this.saveButtonRect.height / 2));
        
        context.restore();
    }

    process(dt) {
        this.samplePlayer.getCurrentSpriteFrames().forEach(frame => {
            frame.process(dt);
        });
        
        if (Game.ContextMenu.active)
            return;
    }

    onMouseDown(e) {
        if (e.button == 0) {// leftclick
            if (Game.ContextMenu.active) {
                const menuItem = Game.ContextMenu.handleMenuSelect();
                Game.ContextMenu.hide();
                return;
            }
        }

        this.saveButtonPressed = this.saveButtonRect.pointWithin(Game.mousePos)
        if (this.rect.pointWithin(Game.mousePos)) {
            this.switchers.forEach(button => button.onMouseDown(e));
        } else {
            Game.activeUiWindow = null;
        }
    }

    onMouseUp(e) {
        this.switchers.forEach(button => button.onMouseUp(e));

        if (e.button == 0 && this.saveButtonPressed && this.saveButtonRect.pointWithin(Game.mousePos)) {
            const animations = [];
            this.switchers.forEach((switcher, part) => {
                animations.push({part: part, upId: switcher.animation.up, color: switcher.animation.color});
            });

            Game.ws.send({
                action: "save_base_animations",
                animations: animations
            });
            
            Game.activeUiWindow = null;
        }
    }

    onMouseScroll(e) {
        
    }

    onResize(worldRect) {

        // width:
        // 10px buffer
        // 32px arrow button
        // 70px name button
        // 32p right arrow button
        // 10px buffer
        // 100px colour button
        // 10px buffer
        // 32px*5x scale character
        // 10px buffer
        const uiWidth = 10 + 32 + 70 + 32 + 10 + 100 + 10 + (32*5) + 10;
        // const uiWidth = worldRect.width / 2;
        const uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;

        const uiHeight = 50 + (this.switchers.size * 40) + 10;
        const uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;

        this.rect = new Rectangle(uix, uiy, uiWidth, uiHeight);

        let rowCount = 0;
        this.switchers.forEach(switcher => switcher.setPos(this.rect.left + 10, this.rect.top + 50 + (rowCount++ * 40)));

        this.saveButtonRect = new Rectangle(uix + uiWidth - 10 - 64, uiy + uiHeight - 10 - 32, 64, 32);
    }
}