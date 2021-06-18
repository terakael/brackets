class LogoffResponse {    
    constructor() {
        this.action = "logoff";
    }

    process(obj) {
        // clean up and change state to logon screen
        Game.currentPlayer = null;
        Game.Room.otherPlayers = [];
        Game.state = 'logonscreen';
    }
}

ResponseController.register(new LogoffResponse());