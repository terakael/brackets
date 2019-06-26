(function(){
    function NPC(obj){
        let npc = Game.npcMap.get(obj.npcId);

        var xy = tileIdToXY(obj.tileId);
        this.id = npc.id,
        this.instanceId = obj.instanceId;// npc instance id is the spawn tile
        this.pos = {x: xy.x, y: xy.y};
        this.dest = {x: xy.x, y: xy.y};
        this.speed = 0;
        this.currentHp = obj.currentHp;
        this.healthBarTimer = 0;
        this.hitsplat = null;
        this.inCombat = false;
        this.chatMessage = "";
        this.chatMessageTimer = 0;
        
        this.spriteframes = [];
        this.spriteframes["up"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(npc.upId).frameData);
        this.spriteframes["up"].setScale({x: npc.scaleX, y: npc.scaleY});
        
        this.spriteframes["down"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(npc.downId).frameData);
        this.spriteframes["down"].setScale({x: npc.scaleX, y: npc.scaleY});
        
        this.spriteframes["left"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(npc.leftId).frameData);
        this.spriteframes["left"].setScale({x: npc.scaleX, y: npc.scaleY});
        
        this.spriteframes["right"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(npc.rightId).frameData);
        this.spriteframes["right"].setScale({x: npc.scaleX, y: npc.scaleY});

        this.spriteframes["attack"] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(npc.attackId).frameData);
        this.spriteframes["attack"].setScale({x: npc.scaleX, y: npc.scaleY});

        this.combatOffset = (this.spriteframes["attack"].getCurrentFrame().width * npc.scaleX) / 2;

        this.currentAnimation = "down";
    }

    NPC.prototype.getLeftclickLabel = function() {
        if (this.get("leftclickOption") === 4096) // attack
            return "attack {0} (lvl {1})".format(this.get("name"), this.get("cmb"));
        return "";
    }
    
    NPC.prototype.process = function(step){
        this.processMovement(step);

        if (this.inCombat && Math.abs((this.dest.x + this.combatOffset) - this.pos.x) < 1 && Math.abs(this.dest.y - this.pos.y) < 1)
            this.currentAnimation = "attack";

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

        if (this.chatMessageTimer > 0) {
            this.chatMessageTimer -= step;
            if (this.chatMessageTimer <= 0) {
                this.chatMessageTimer = 0;
                this.chatMessage = "";
            }
        }
    }
    
    NPC.prototype.draw = function(context, xView, yView) {
        // the sprite itself is drawn in the main room via the drawMap.
        // we still draw hitsplats and health bar here though.
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        let frameHeight = this.spriteframes[this.currentAnimation].getCurrentFrame().height;
        this.drawHealthBar(context, (this.pos.x - xView + 2.5) * Game.scale, (this.pos.y - yView - frameHeight - (10 * (1/Game.scale))) * Game.scale, this.currentHp, this.get("maxHp"));

        if (this.hitsplat) {
            context.fillStyle = this.hitsplat.damage == 0 ? "rgba(0, 0, 255, 0.5)" : "rgba(255, 0, 0, 0.5)";
            context.fillRect((this.pos.x - xView - 8) * Game.scale, (this.pos.y - yView - 8) * Game.scale, 16 * Game.scale, 16 * Game.scale);
            
            context.fillStyle = "white";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = "bold 20pt Consolas";
            context.fillText(this.hitsplat.damage, (this.pos.x - xView) * Game.scale, (this.pos.y - yView) * Game.scale);
        }

        if (this.chatMessage != "") {
            context.font = "12pt Consolas";
            context.textAlign = "center";
            context.fillStyle = "yellow"
            context.fillText(this.chatMessage, (this.pos.x - xView) * Game.scale, (this.pos.y - yView - frameHeight - (this.healthBarTimer > 0 ? 15 : 0)) * Game.scale);
        }
        context.restore();
    }

    NPC.prototype.processMovement = function(step) {
        var diffx = (this.dest.x + (this.inCombat ? this.combatOffset : 0)) - this.pos.x;
        var diffy = this.dest.y - this.pos.y;
        
        let moving = false;
        if (Math.abs(diffx) > 1 || Math.abs(diffy) > 1) {
            var n = Math.getVectorNormal({x: diffx, y: diffy});
            if (Math.abs(n.x * step * this.speed) > Math.abs(diffx) || Math.abs(diffx) > 64)
                this.pos.x = this.dest.x + (this.inCombat ? this.combatOffset : 0);
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
            moving = true;
        }

        if (moving || this.inCombat || this.getCurrentSpriteFrame().alwaysAnimate())
            this.spriteframes[this.currentAnimation].process(step);
        else
            this.spriteframes[this.currentAnimation].currentFrame = 1;
    }

    NPC.prototype.getCurrentSpriteFrame = function() {
        return this.spriteframes[this.currentAnimation];
    }

    NPC.prototype.setDestPosAndSpeedByTileId = function(tileId) {
        var xy = tileIdToXY(tileId);

        this.dest.x = xy.x;
        this.dest.y = xy.y;

        var diffx = xy.x - this.pos.x + (this.inCombat ? this.combatOffset : 0);
        var diffy = xy.y - this.pos.y;
        var mag = Math.getVectorMagnitude({x: diffx, y: diffy});
        this.speed = mag / 0.6;
    }

    NPC.prototype.handleNpcUpdate = function(obj) {
        if (obj.hasOwnProperty("hp")) {
            // set current hp
            this.currentHp = obj.hp;
        }

        if (obj.hasOwnProperty("damage")) {
            // damage hitsplat on top of the npc, set health bar timer
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
        ctx.fillRect(x - ~~(barLength/2), y - 2.5, currentHpLength, 5);

        ctx.fillStyle = "#f00";
        ctx.fillRect(x - ~~(barLength/2) + currentHpLength, y - 2.5, barLength - currentHpLength, 5);

        return true;
    }

    NPC.prototype.setChatMessage = function(message) {
        this.chatMessage = message;
        this.chatMessageTimer = 3;
    }

    NPC.prototype.get = function(val) {
        return Game.npcMap.get(this.id)[val];
    }

    
    Game.NPC = NPC;		
})();