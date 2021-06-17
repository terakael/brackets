class AddMinimapSegmentsResponse {    
    constructor() {
        this.action = "add_minimap_segments";
    }

    process(obj) {
        for (const [segmentId, data] of Object.entries(obj.segments)) {
            Game.Room.loadMinimap(data, Number(segmentId));
        }
        Game.Minimap.addMinimapIconLocations(obj.minimapIconLocations);
    }
}

ResponseController.register(new AddMinimapSegmentsResponse());