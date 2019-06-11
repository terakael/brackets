(function() {
    function DialogueWindow(rect, message) {
        this.rect = rect;
        this.dialogue = message;
    }
    
    DialogueWindow.prototype.draw = function(context, xview, yview) {
        context.save();

        context.fillStyle = "rgba(0, 0, 0, 0.6)";
        context.strokeStyle = "red";
        context.lineWidth = 1;
        
        context.fillRect(~~(this.rect.left) + 0.5, ~~(this.rect.top) + 0.5, this.rect.width, this.rect.height);
        context.strokeRect(~~(this.rect.left) + 0.5, ~~(this.rect.top) + 0.5, this.rect.width, this.rect.height);

        context.font = "20pt Consolas";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "red";

        // split dialogue into multiple lines if necessary
        context.fillText(this.dialogue, this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height / 2));

        // let counter = 0;
        // let dialogue = this.dialogue;
        // while (true) {
        //     let idx = dialogue.indexOf(" ", 10);
        //     if (idx >= 0) {
        //         let toDisplay = dialogue.substr(0, idx);
        //         dialogue = dialogue.substr(idx);
        //         context.fillText(toDisplay, this.rect.left + (this.rect.width / 2), this.rect.top + (this.rect.height / 2) + (counter++ * 20));
        //     }

        //     if (!dialogue.length)
        //         break;
        // }
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