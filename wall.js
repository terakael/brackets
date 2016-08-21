(function() {
    function Wall(x, y) {
        this.x = x;
        this.y = y;
        this.sprite = new Game.Sprite();
        this.sprite.w = 64;
        this.sprite.h = 64;
        this.sprite.anchor = {x: 0.5, y: 1};
        this.sprite.types = {
            idle: {
                speed: 0,
                frames: [{x:428, y:280, w:64, h:64}]
            }
        };
    };
    Wall.prototype = {
        constructor: Wall,
        image: null,
        draw: function(c, xview, yview) {
            this.sprite.draw(c, this.x - xview, this.y - yview, this.image);
        }
    };
    Game.Wall = Wall;
})();