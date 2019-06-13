(function() {
    function DialogueWindow(rect, obj) {
        this.rect = rect;
        this.dialogue = obj.dialogue;
        this.speaker = obj.speaker;

        let maxCharsPerLine = 60;
        this.lines = wordWrap(this.dialogue, maxCharsPerLine).split('\n');
    }
    
    DialogueWindow.prototype.draw = function(context, xview, yview) {
        context.save();

        context.fillStyle = "rgba(0, 0, 0, 0.6)";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        
        context.fillRect(~~(this.rect.left) + 0.5, ~~(this.rect.top) + 0.5, this.rect.width, this.rect.height);
        context.strokeRect(~~(this.rect.left) + 0.5, ~~(this.rect.top) + 0.5, this.rect.width, this.rect.height);

        context.font = "12pt Consolas";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "white";

        context.fillText(this.speaker, this.rect.left + (this.rect.width / 2), this.rect.top + 15);
        
        let lineHeight = 20;
        let totalLineHeight = (this.lines.length - 1) * lineHeight;

        context.fillStyle = "red";
        context.font = "15pt Consolas";
        for (let i = 0; i < this.lines.length; ++i) {
            context.fillText(this.lines[i], this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height / 2) - (totalLineHeight / 2) + (i * lineHeight));
        }
        context.restore();
    }

    DialogueWindow.prototype.process = function(dt) {

    }

    DialogueWindow.prototype.onMouseDown = function(e) {
        if (!this.rect.pointWithin(Game.mousePos)) {
            Game.activeUiWindow = null;
        } else {
            Game.ws.send({action: "dialogue"});
        }
    }

    DialogueWindow.prototype.onMouseUp = function(e) {

    }

    Game.DialogueWindow = DialogueWindow;
}());