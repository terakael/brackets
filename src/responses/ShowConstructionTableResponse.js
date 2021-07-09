class ShowConstructionTableResponse {    
    constructor() {
        this.action = "show_construction_table";
    }

    process(obj) {
        Game.activeUiWindow = new ConstructionWindow(Game.worldCameraRect, obj.constructableOptions, obj.flatpack, obj.tileId);
    }
}

ResponseController.register(new ShowConstructionTableResponse());