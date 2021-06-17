class RemoveMinimapSegmentsResponse {    
    constructor() {
        this.action = "remove_minimap_segments";
    }

    process(obj) {
        for (let i = 0; i < obj.segments.length; ++i)
            Game.Minimap.removeMinimapsBySegmentId(obj.segments[i]);
    }
}

ResponseController.register(new RemoveMinimapSegmentsResponse());