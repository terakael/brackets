(function(){
    function NPC(obj){
        var xy = tileIdToXY(obj.tileId);
        this.id = obj.dto.tileId;// npc instance id is the spawn tile
        this.name = obj.dto.name;
        this.pos = {x: xy.x, y: xy.y};
        this.dest = {x: xy.x, y: xy.y};
        this.leftclickOption = obj.dto.leftclickOption;
        this.speed = 0;
        
        this.spriteframes = [];
        this.spriteframes["up"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(obj.dto.upId).frameData);
        this.spriteframes["down"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(obj.dto.downId).frameData);
        this.spriteframes["left"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(obj.dto.leftId).frameData);
        this.spriteframes["right"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(obj.dto.rightId).frameData);
        // this.spriteframes["up"] = Game.SpriteManager.getSpriteFrameById(obj.dto.upId);

        this.currentAnimation = "down";
    }
    
    NPC.prototype.process = function(step){
        var diffx = this.dest.x - this.pos.x;
        var diffy = this.dest.y - this.pos.y;
        
        if (Math.abs(diffx) > 1 || Math.abs(diffy) > 1) {
            var n = Math.getVectorNormal({x: diffx, y: diffy});
            if (Math.abs(n.x * step * this.speed) > Math.abs(diffx) || Math.abs(diffx) > 64)
                this.pos.x = this.dest.x;
            else
                this.pos.x += n.x * step * this.speed;
            
            if (Math.abs(n.y * step * this.speed) > Math.abs(diffy) || Math.abs(diffy) > 64)
                this.pos.y = this.dest.y;
            else
                this.pos.y += n.y * step * this.speed;

            var atan = Math.atan2(n.y, n.x);
            var d = (atan > 0 ? atan : (2*Math.PI + atan)) * 360 / (2*Math.PI);
            
            if (!Game.isometric)
                d -= 45;// offset the angle slightly to adhere to non-isometric camera
            if (d >= 0 && d < 90) {
                this.currentAnimation = "down";
            } else if (d >= 90 && d < 180) {
                this.currentAnimation = "left";
            } else if (d >= 180 && d < 270) {
                this.currentAnimation = "up";
            } else {
                this.currentAnimation = "right";
            }

            this.spriteframes[this.currentAnimation].process(step);
        } else {
            this.spriteframes[this.currentAnimation].currentFrame = 1;
        }
    }
    
    NPC.prototype.draw = function(context, xView, yView) {
        // the sprite itself is drawn in the main room via the drawMap.
        // we still draw hitsplats and health bar here though.
    }

    NPC.prototype.getCurrentSpriteFrame = function() {
        return this.spriteframes[this.currentAnimation];
    }

    NPC.prototype.setDestPosAndSpeedByTileId = function(tileId) {
        var xy = tileIdToXY(tileId);
        this.dest.x = xy.x;
        this.dest.y = xy.y;

        var diffx = xy.x - this.pos.x;
        var diffy = xy.y - this.pos.y;
        var mag = Math.getVectorMagnitude({x: diffx, y: diffy});
        this.speed = mag / 0.6;
    }
    
    Game.NPC = NPC;		
})();