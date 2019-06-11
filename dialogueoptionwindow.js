(function() {
    function DialogueOptionWindow(rect, options) {
        this.rect = rect;
        this.options = options;

        let buttonHeight = 30;
        let buffer = 10;
        let totalButtonHeight = (buttonHeight * this.options.length) + (buffer * this.options.length);
        let topButtonY = (this.rect.top + (this.rect.height / 2)) - (totalButtonHeight / 2);
        
        for (let i = 0; i < this.options.length; ++i) {
            this.options[i].rect = new Game.Rectangle(~~(this.rect.left + buffer) + 0.5, ~~(topButtonY + (i * (buttonHeight + buffer))) + 0.5, this.rect.width - (buffer * 2), buttonHeight);
        }
    }
    
    DialogueOptionWindow.prototype.draw = function(context, xview, yview) {
        context.save();

        context.fillStyle = "rgba(0, 0, 0, 0.6)";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        
        context.fillRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);
        context.strokeRect(this.rect.left, this.rect.top, this.rect.width, this.rect.height);

        context.font = "15pt Consolas";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "red";

        for (let i = 0; i < this.options.length; ++i) {
            context.strokeRect(this.options[i].rect.left, this.options[i].rect.top, this.options[i].rect.width, this.options[i].rect.height);
            if (this.options[i].selected) {
                context.save();
                context.fillStyle = "#500";
                context.fillRect(this.options[i].rect.left, this.options[i].rect.top, this.options[i].rect.width, this.options[i].rect.height);
                context.restore();
            }
            context.fillText(this.options[i].optionText, this.options[i].rect.left + (this.options[i].rect.width / 2), this.options[i].rect.top + (this.options[i].rect.height / 2));
        }

        context.restore();
    }

    DialogueOptionWindow.prototype.process = function(dt) {
        for (let i = 0; i < this.options.length; ++i) {
            this.options[i].selected = this.options[i].rect.pointWithin(Game.mousePos);
        }
    }

    DialogueOptionWindow.prototype.onMouseDown = function(e) {
        if (!this.rect.pointWithin(Game.mousePos)) {
            Game.activeUiWindow = null;
        } else {
            for (let i = 0; i < this.options.length; ++i) {
                if (this.options[i].selected) {
                    Game.ws.send({action: "dialogue_option", id: this.options[i].optionId});
                }
            }
        }
    }

    DialogueOptionWindow.prototype.onMouseUp = function(e) {

    }

    Game.DialogueOptionWindow = DialogueOptionWindow;
}());