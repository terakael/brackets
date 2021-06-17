window.Game = {
    worldTileWidth: 46325,
    segmentWidth: 25,
    worldSegmentWidth: function() {
        return this.worldTileWidth / this.segmentWidth;
    },
    getMousePos: function (e) {
        if (Game.boundingRect)
            return { x: e.clientX - Game.boundingRect.left, y: e.clientY - Game.boundingRect.top };
        return {x: 0, y: 0};
    }
};