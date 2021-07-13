class NpcInRangeResponse {    
    constructor() {
        this.action = "npc_in_range";
    }

    process(obj) {
        console.log(obj);

        for (let i = 0; i < obj.npcs.length; ++i) {
            Game.Room.npcs.push(new Game.NPC(obj.npcs[i]));
        }
    }
}

ResponseController.register(new NpcInRangeResponse());