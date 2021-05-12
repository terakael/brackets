window.Game = {
    worldTileWidth: 46325,
    segmentWidth: 25,
    worldSegmentWidth: function() {
        return this.worldTileWidth / this.segmentWidth;
    }
};