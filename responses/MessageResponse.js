class MessageResponse {    
    constructor() {
        this.action = "message";
    }

    process(obj) {
        const {id, name, message, colour} = obj;
        if (message) {
            Game.ChatBox.add(`${name}: ${message}`, colour || 'yellow');
            Game.Room.playerById(id, p => p.setChatMessage(message));
        }
    }
}

ResponseController.register(new MessageResponse());