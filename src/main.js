// class Game {
//     constructor() {
//         this.worldTileWidth = 46325;
//         this.segmentWidth = 25;
//     }

//     worldSegmentWidth() {
//         return this.worldTileWidth / this.segmentWidth;
//     }

//     getMousePos(e) {
//         if (this.boundingRect)
//             return { x: e.clientX - this.boundingRect.left, y: e.clientY - this.boundingRect.top };
//         return {x: 0, y: 0};
//     }
// }

// window.Game = new Game();





window.Game = {
    ip: "192.168.1.2", 
    // ip: "192.168.2.107", 
    port: "45555", 
    resourcePort: "45556",

    worldTileWidth: 46325,
    segmentWidth: 25,
    state: 'logonscreen',
    scale: 3,
    targetScale: 3,
    maxScale: 5,
    minScale: 1,
    brightness: 1,
    targetBrightness: 1,
    sceneryMap: new Map(),
    npcMap: new Map(),
    drawBoundingBoxes: false,
    drawGroundTextureOutline: false,
    drawShadows: false,
    mousePos: { x: 0, y: 0 },
    activeUiWindow: null,
    enableSmoothing: false,
    responseQueue: [],

    worldSegmentWidth: function() {
        return this.worldTileWidth / this.segmentWidth;
    },
    calculateMousePos: function (e) {
        this.mousePos = Game.boundingRect 
            ? { x: e.clientX - Game.boundingRect.left, y: e.clientY - Game.boundingRect.top }
            : {x: 0, y: 0};
    }
};