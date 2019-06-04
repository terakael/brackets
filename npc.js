(function(){
    function NPC(obj){
        var xy = tileIdToXY(obj.tileId);
        this.id = obj.dto.tileId;// npc instance id is the spawn tile
        this.name = obj.dto.name;
        this.cmb = obj.dto.cmb;
        this.pos = {x: xy.x, y: xy.y};
        this.dest = {x: xy.x, y: xy.y};
        this.leftclickOption = obj.dto.leftclickOption;
        this.speed = 0;
        this.currentHp = obj.currentHp;
        this.maxHp = obj.dto.hp;
        this.healthBarTimer = 0;
        this.hitsplat = null;
        
        this.spriteframes = [];
        this.spriteframes["up"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(obj.dto.upId).frameData);
        this.spriteframes["down"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(obj.dto.downId).frameData);
        this.spriteframes["left"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(obj.dto.leftId).frameData);
        this.spriteframes["right"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(obj.dto.rightId).frameData);
        // this.spriteframes["attack"] = Game.SpriteManager.getSpriteFrameById(obj.dto.upId);

        this.currentAnimation = "down";
    }

    NPC.prototype.getLeftclickLabel = function() {
        if (this.leftclickOption === 4096) // attack
            return "attack {0} (lvl {1})".format(this.name, this.cmb);
        return "";
    }
    
    NPC.prototype.process = function(step){
        this.processMovement(step);

        if (this.healthBarTimer > 0) {
            this.healthBarTimer -= step;
            if (this.healthBarTimer < 0)
                this.healthBarTimer = 0;
        }

        if (this.hitsplat) {
            this.hitsplat.lifetime -= step;
            if (this.hitsplat.lifetime <= 0)
                this.hitsplat = null;
        }
    }
    
    NPC.prototype.draw = function(context, xView, yView) {
        // the sprite itself is drawn in the main room via the drawMap.
        // we still draw hitsplats and health bar here though.
        context.save();
        let frameHeight = this.spriteframes[this.currentAnimation].getCurrentFrame().height;
        this.drawHealthBar(context, this.pos.x - xView, this.pos.y - yView - frameHeight, this.currentHp, this.maxHp);

        if (this.hitsplat) {
            context.fillStyle = this.hitsplat.damage == 0 ? "blue" : "red";
            context.fillRect(this.pos.x - xView - (8 * (1/Game.scale)), this.pos.y - yView - (8 * (1/Game.scale)), 16 * (1/Game.scale), 16 * (1/Game.scale));
            
            context.fillStyle = "white";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = "bold " + (20 * (1/Game.scale)) + "pt Consolas";
            context.fillText(this.hitsplat.damage, this.pos.x - xView, this.pos.y - yView);
        }
        context.restore();
    }

    NPC.prototype.processMovement = function(step) {
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

    NPC.prototype.handleNpcUpdate = function(obj) {
        if (obj.hasOwnProperty("tileId"))
            this.setDestPosAndSpeedByTileId(obj.tileId);
        
        if (obj.hasOwnProperty("hp")) {
            // set current hp
            this.currentHp = obj.hp;
        }

        if (obj.hasOwnProperty("damage")) {
            // damage hitsplat on top of the npc, set health bar timer
            // this.stats.showHealthBar();
            this.hitsplat = {
                damage: obj.damage,
                lifetime: 1
            };
            this.healthBarTimer = 5;
        }
    }

    NPC.prototype.drawHealthBar = function(ctx, x, y, currentHp, maxHp) {
        if (this.healthBarTimer === 0)
            return false;

        var barLength = 32;
        var currentHpLength = ~~(barLength * (currentHp/maxHp));

        ctx.fillStyle = "#0f0";
        ctx.fillRect(x - ~~(barLength/2), y - 2.5, currentHpLength * (1/Game.scale), 5 * (1/Game.scale));

        ctx.fillStyle = "#f00";
        ctx.fillRect(x - ~~(barLength/2) + (currentHpLength * (1/Game.scale)), y - 2.5, (barLength - currentHpLength) * (1/Game.scale), 5 * (1/Game.scale));
        return true;
    }
    
    Game.NPC = NPC;		
})();