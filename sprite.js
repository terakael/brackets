(function() {
    function Sprite() {
        
    };
    Sprite.prototype = {
        constructor: Sprite,
        speed: 0,
        currentType: "idle",
        currentFrame: 0,
        anchor: {x: 0, y: 0},
        w: 32,
        h: 32,
        process: function(dt) {
            if (!this.types)// types is added by the object that wants the sprite frames
                return;
            
            this.speed -= dt;
            if (this.speed < 0) {
                // time to switch frames
                var currentType = this.types[this.currentType];
                if (!currentType)
                    return;
                
                this.speed = currentType.speed;
                switch (currentType.loop) {
                    case "pingpong": {
                        if (currentType.forwards) {
                            if ((this.currentFrame + 1) >= currentType.frames.length) {
                                currentType.forwards = !currentType.forwards;
                                --this.currentFrame;
                            } else {
                                ++this.currentFrame;
                            }
                        } else {
                            if (this.currentFrame - 1 < 0) {
                                currentType.forwards = !currentType.forwards;
                                ++this.currentFrame;
                            } else {
                                --this.currentFrame;
                            }
                        }
                        break;
                    }
                    default: {
                        if (currentType.forwards && ++this.currentFrame >= currentType.frames.length) {
                            this.currentFrame = 0;
                        } else if (!currentType.forwards && --this.currentFrame < 0) {
                            this.currentFrame = currentType.frames.length - 1;
                        }
                        break;
                    }
                }
            }
        },
        switchType: function(type) {
            if (this.types && this.types[type] && this.currentType != type) {
                this.currentType = type;
                this.currentFrame = 0;
            }
        },
        draw: function(c, x, y, img) {
            if (!this.types || !img)
                return;
            var frame = this.types[this.currentType].frames[this.currentFrame];
            c.drawImage(img, ~~frame.x, ~~frame.y, frame.w, frame.h, x - (this.anchor.x * this.w), y - (this.anchor.y * this.h), this.w, this.h);
        }
    };
    
    Game.Sprite = Sprite;
})();