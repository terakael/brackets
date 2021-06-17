class TalkToResponse {    
    constructor() {
        this.action = "talk to";
    }

    process(obj) {
        const {objectId, message} = obj;
        Game.Room.npcById(objectId, npc => npc.setChatMessage(message));
    }
}

ResponseController.register(new TalkToResponse());