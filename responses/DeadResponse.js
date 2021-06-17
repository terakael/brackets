class DeadResponse {    
    constructor() {
        this.action = "dead";
    }

    process(obj) {
        Game.Room.playerById(obj.id, p => p.setDeathSequence());
    }
}

ResponseController.register(new DeadResponse());