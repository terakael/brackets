class NpcOutOfRangeResponse {    
    constructor() {
        this.action = "npc_out_of_range";
    }

    process(obj) {
        // instances: [38602]
        // success: 1
        // responseText: ""
        // action: "npc_out_of_range"
        Game.Room.npcs = Game.Room.npcs.filter(e => !obj.instances.includes(e.instanceId));
    }
}

ResponseController.register(new NpcOutOfRangeResponse());