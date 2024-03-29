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
        this.partAreaRect = new Rectangle(this.leftArrowRect.right, this.leftArrowRect.top, this.rightArrowRect.left - this.leftArrowRect.right, this.leftArrowRect.height);
    }

    draw(context, isSelected) {
        if (this.partAreaRect.pointWithin(Game.mousePos)) {
            context.fillStyle = "#333";
            context.fillRect(this.partAreaRect.left, this.partAreaRect.top, this.partAreaRect.width, this.partAreaRect.height);
        }

        if (isSelected) {
            context.strokeStyle = "#f00";
            context.lineWidth = 1;
            context.strokeRect(this.partAreaRect.left, this.partAreaRect.top, this.partAreaRect.width, this.partAreaRect.height);
        }

        context.strokeStyle = "red";
        context.lineWidth = this.leftArrowRect.pointWithin(Game.mousePos) ? 3 : 1;
        context.strokeRect(this.leftArrowRect.left, this.leftArrowRect.top, this.leftArrowRect.width, this.leftArrowRect.height);
        if (this.leftArrowPressed) {
            context.fillStyle = "#f00";
            context.fillRect(this.leftArrowRect.left, this.leftArrowRect.top, this.leftArrowRect.width, this.leftArrowRect.height);
        }
        
        context.lineWidth = this.rightArrowRect.pointWithin(Game.mousePos) ? 3 : 1;
        context.strokeRect(this.rightArrowRect.left, this.rightArrowRect.top, this.rightArrowRect.width, this.rightArrowRect.height);
        if (this.rightArrowPressed) {
            context.fillStyle = "#f00";
            context.fillRect(this.rightArrowRect.left, this.rightArrowRect.top, this.rightArrowRect.width, this.rightArrowRect.height);
        }

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "20px customFont";
        context.fillStyle = "white";
        context.fillText("<-", this.leftArrowRect.left + (this.leftArrowRect.width / 2), this.leftArrowRect.top + (this.leftArrowRect.height / 2));
        context.fillText("->", this.rightArrowRect.left + (this.rightArrowRect.width / 2), this.rightArrowRect.top + (this.rightArrowRect.height / 2));
        context.fillText(this.name, this.nameRect.left + (this.nameRect.width / 2), this.nameRect.top + (this.nameRect.height / 2));
    }

    onMouseDown(e) {
        this.leftArrowPressed = this.leftArrowRect.pointWithin(Game.mousePos);
        this.rightArrowPressed = this.rightArrowRect.pointWithin(Game.mousePos);
        this.colorRectPressed = this.colorRect.pointWithin(Game.mousePos);
    }

    onMouseUp(e) {
        this.selectedPart = false;
        
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
        }
        
        this.leftArrowPressed = false;
        this.rightArrowPressed = false;
        this.colorRectPressed = false;
    }
}

class ColorPalette {
    constructor(colors, onColorChange) {
        this.x = 0;
        this.y = 0;
        this.colors = colors.map(c => decToHexColor(c));

        this.onColorChange = onColorChange;
    }

    set(x, y) {
        this.x = x + 2;
        this.y = y + 2;
        this.selected = null;
        this.rect = new Rectangle(this.x, this.y, 25 * 4, 25 * 8);
    }

    draw(context) {
        this.selected = null;
        for (let y = 0; y < 8; ++y) {
            for (let x = 0; x < 4; ++x) {
                const rect = new Rectangle(~~(this.x + (x * 25)), ~~(this.y + (y * 25)), 23, 23);
                context.fillStyle = this.colors[(x % 4) + (y * 4)];
                context.fillRect(rect.left, rect.top, rect.width, rect.height);

                if (rect.pointWithin(Game.mousePos)) {
                    context.lineWidth = 3;
                    context.strokeStyle = "red";
                    context.strokeRect(rect.left, rect.top, rect.width, rect.height);
                    this.selected = {x, y};
                }
            }
        }
    }

    onMouseDown(e) {
        if (this.selected) {
            const color = this.colors[(this.selected.x % 4) + (this.selected.y * 4)]
            this.onColorChange(parseInt(color.slice(1), 16));
        }
    }
}

class BaseAnimationsWindow {
    constructor(rect, baseAnimations, customizableAnimations, colors) {
        this.rect = rect;
        this.saveButtonPressed = false;
        this.playerDirections = ["down", "right", "up", "left"];
        this.samplePlayer = new Game.Player({id: -1, name: "", tileId: -1, combatLevel: -1, currentHp: -1, maxHp: -1});
        this.samplePlayer.setAnimations({...customizableAnimations, ...baseAnimations});

        this.switchers = new Map();
        this.colorBars = new Map();
        this.palette = new ColorPalette(colors, color => {
            const animation = this.selectedSwitcher.animation;
            animation.color = color;
            this.samplePlayer.setAnimation(this.selectedSwitcher.name.toUpperCase(), animation)
        });
        
        for (let part in customizableAnimations) {
            this.switchers.set(part, 
                new BaseAnimationSwitcher(part.toLowerCase(), 
                    customizableAnimations[part], 
                    customizableAnimations[part]["color"] || 0, 
                    (part, animation) => this.samplePlayer.setAnimation(part, animation)));
        }

        this.selectedSwitcher = this.switchers.values().next().value;
        console.log(this.selectedSwitcher)

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
        context.font = "20px customFont";

        let y = this.rect.top + 20;
        context.fillText("- character customization -", this.rect.left + (this.rect.width / 2), y);

        context.fillStyle = "#222";
        context.fillRect(this.samplePlayerRect.left, this.samplePlayerRect.top, this.samplePlayerRect.width, this.samplePlayerRect.height);

        context.strokeStyle = "red";
        context.strokeRect(this.samplePlayerRect.left, this.samplePlayerRect.top, this.samplePlayerRect.width, this.samplePlayerRect.height);

        const scale = 5;
        context.save();
        const transform = new Transform();
        transform.scale(scale, scale);
        context.setTransform.apply(context, transform.m);

        const {width, height} = this.samplePlayer.getBaseSpriteFrame().getCurrentFrame();
        this.samplePlayer.getCurrentSpriteFrames().forEach(frame => {
            frame.draw(context, 
                ((this.rect.right - 10) / scale) - (width / 2),
                ((this.rect.top + (this.rect.height / 2) - 10) / scale) + (height / 2));
        });
        context.restore();

        this.switchers.forEach(switcher => switcher.draw(context, this.selectedSwitcher === switcher));
        this.palette.draw(context);

        context.strokeStyle = "red";
        context.lineWidth = this.saveButtonRect.pointWithin(Game.mousePos) ? 3 : 1;
        context.strokeRect(this.saveButtonRect.left, this.saveButtonRect.top, this.saveButtonRect.width, this.saveButtonRect.height);
        if (this.saveButtonPressed) {
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
        this.samplePlayer.getBaseSpriteFrame().process(dt);
        this.samplePlayer.baseframes.forEach(frame => {
            frame[this.playerDirections[0]].currentFrame = this.samplePlayer.getBaseSpriteFrame().currentFrame;
        });
        
        if (Game.ContextMenu.active)
            return;
    }

    onMouseDown(e) {
        if (e.button !== 0)
            return;
        
        if (this.rect.pointWithin(Game.mousePos)) {
            this.saveButtonPressed = this.saveButtonRect.pointWithin(Game.mousePos)
            if (this.palette.rect.pointWithin(Game.mousePos)) {
                this.palette.onMouseDown(e);
            }
            
            this.switchers.forEach(switcher => {
                if (switcher.mainRect.pointWithin(Game.mousePos)) {
                    this.selectedSwitcher = switcher;
                    switcher.onMouseDown(e);
                }
            });
        } else {
            Game.activeUiWindow = null;
        }
    }

    onMouseUp(e) {
        if (e.button !== 0)
            return;

        if (this.samplePlayerRect.pointWithin(Game.mousePos)) {
            const removedElement = this.playerDirections.shift();
            this.playerDirections.push(removedElement);
            this.samplePlayer.currentAnimation = this.playerDirections[0];
        }

        

        this.switchers.forEach(button => button.onMouseUp(e));

        if (this.saveButtonPressed && this.saveButtonRect.pointWithin(Game.mousePos)) {
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
        this.saveButtonPressed = false;
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
        this.switchers.forEach(switcher => switcher.setPos(this.rect.left + 10, this.rect.top + 50 + (rowCount++ * 42)));

        this.saveButtonRect = new Rectangle(uix + uiWidth - 10 - (32*5), uiy + uiHeight - 10 - 32, (32*5), 32);
        this.samplePlayerRect = new Rectangle(this.rect.right - 10 - (32*5), this.rect.top + 50, (32*5), (32*5));

        this.palette.set(this.switchers.values().next().value.rightArrowRect.right + 10, this.samplePlayerRect.top);
    }
}