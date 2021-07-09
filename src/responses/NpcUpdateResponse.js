class NpcUpdateResponse {    
    constructor() {
        this.action = "npc_update";
    }

    process(obj) {
        Game.Room.npcById(obj.instanceId, npc => npc.handleNpcUpdate(obj));
    }
}

ResponseController.register(new NpcUpdateResponse());