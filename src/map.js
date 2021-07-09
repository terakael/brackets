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

    // add "class" Map to our Game object
    Game.Map = Map;

})();