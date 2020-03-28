(function(){
    function Map(width, height, sw, sh){
        // map dimensions
        this.width = width;
        this.height = height;
        this.swidth = sw;
        this.sheight = sh;

        // map texture
        this.image = null;
    }

    // Map.prototype.load = function(context, imageData) {
    //     var pattern = context.createPattern(imageData, "repeat");
    //     var ctx = document.createElement("canvas").getContext("2d");
    //     ctx.canvas.width = this.width;
    //     ctx.canvas.height = this.height;
    //     ctx.save();
    //     ctx.fillStyle = pattern;
    //     ctx.fillRect(0, 0, this.width, this.height);
    //     ctx.restore();

    //     this.image = imageData;
    //     this.image.src = ctx.canvas.toDataURL("image/png");// this is slow af, takes over a second
    //     ctx = null;
    // }

    // add "class" Map to our Game object
    Game.Map = Map;

})();