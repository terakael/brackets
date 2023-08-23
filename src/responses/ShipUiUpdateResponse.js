class ShipUiUpdateResponse {    
    constructor() {
        this.action = "ship_ui_update";
    }

    process(obj) {
        // Game.Room.playerById(obj.id, p => p.handlePlayerUpdate(obj));
        Game.shipUi.updateUi(obj);
    }
}

ResponseController.register(new ShipUiUpdateResponse());