class DialogueOption {
    constructor(text) {
        this.text = text;
    }

    draw(context, isHover) {
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        if (isHover) {
            context.save();
            context.fillStyle = "#500";
            context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
            context.restore();
        }
        context.fillText(this.text, this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height / 2));
    }

    setRect(x, y, w, h) {
        this.rect = new Rectangle(x, y, w, h);
    }
}

class DialogueOptionWindow {
    constructor(worldRect, options) {
        this.options = new Map();
        for (const [key, value] of Object.entries(options)) {
            this.options.set(Number(key), new DialogueOption(value));
        }
        
        this.buffer = 10;
        this.buttonHeight = 30;
        this.onResize(worldRect);
        this.hoverOption = 0;
    }
    
    draw(context, xview, yview) {
        context.save();

        context.fillStyle = "rgba(0, 0, 0, 0.6)";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        context.font = "15pt customFont";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "red";

        this.options.forEach((option, id) => option.draw(context, id === this.hoverOption));

        context.restore();
    }

    process(dt) {
        this.options.forEach((option, id) => {
            if (option.rect.pointWithin(Game.mousePos))
                this.hoverOption = id;
        });
    }

    onMouseDown(e) {
        if (!this.rect.pointWithin(Game.mousePos)) {
            Game.activeUiWindow = null;
        } else {
            Game.ws.send({action: "select_dialogue_option", optionId: this.hoverOption})
        }
    }

    onMouseUp(e) {

    }

    onResize(worldRect) {
        let uiWidth = worldRect.width / 2;
        let uiHeight = (this.options.size * (this.buttonHeight + this.buffer)) + this.buttonHeight; // 30 is button height + 10 buffer for each; 30 is top/bottom buffer
        let uix = ~~((worldRect.width / 2) - (uiWidth / 2)) + 0.5;
        let uiy = ~~((worldRect.height / 2) - (uiHeight / 2)) + 0.5;
        this.rect = new Rectangle(uix, uiy, uiWidth, uiHeight);

        let totalButtonHeight = (this.buttonHeight * this.options.size) + (this.buffer * this.options.size);
        let topButtonY = (this.rect.top + (this.rect.height / 2)) - (totalButtonHeight / 2);
        
        let optionIndex = 0;
        this.options.forEach(option => {
            option.setRect(~~(this.rect.left + this.buffer) + 0.5, 
            ~~(topButtonY + (optionIndex++ * (this.buttonHeight + this.buffer))) + 0.5, 
            this.rect.width - (this.buffer * 2), 
            this.buttonHeight);
        });
    }
}