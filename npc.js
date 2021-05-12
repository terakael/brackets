(function(){
    function NPC(obj){
        const npc = Game.npcMap.get(obj.npcId);

        this.tileId = obj.tileId;
        const xy = tileIdToXY(obj.tileId);
        this.id = npc.id,
        this.instanceId = obj.instanceId;// npc instance id is the spawn tile
        this.pos = {x: xy.x, y: xy.y};
        this.dest = {x: xy.x, y: xy.y};
        this.speed = 0;
        this.currentHp = obj.currentHp;
        this.healthBarTimer = 0;
        // this.hitsplat = null;
        this.hitsplats = [];
        this.inCombat = false;
        this.chatMessage = "";
        this.chatMessageTimer = 0;
        this.deathTimer = 0;

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

        this.combatOffset = (this.spriteframes["attack"].getCurrentFrame().width * npc.scaleX) / 4;

        const potentialStartAnimations = ["up", "down", "left", "right"];
        this.currentAnimation = potentialStartAnimations[Math.floor(Math.random() * potentialStartAnimations.length)];
    }

    NPC.prototype.getLeftclickLabel = function() {
        if (this.get("leftclickOption") === 4096) // attack
            return "attack {0} (lvl {1})".format(this.get("name"), this.get("cmb"));
        return "";
    }
    
    NPC.prototype.process = function(step){
        if (this.currentHp == 0) {
            this.deathTimer += step;
        } else {
            this.deathTimer = 0;
        }

        if (this.deathTimer === 0)
            this.processMovement(step);

        if (this.healthBarTimer > 0) {
            this.healthBarTimer -= step;
            if (this.healthBarTimer < 0)
                this.healthBarTimer = 0;
        }

        // if (this.hitsplat) {
        //     this.hitsplat.lifetime -= step;
        //     if (this.hitsplat.lifetime <= 0)
        //         this.hitsplat = null;
        // }

        for (let i = 0; i < this.hitsplats.length; ++i) {
            this.hitsplats[i].lifetime -= step;
            if (this.hitsplats[i].lifetime < 0)
                this.hitsplats[i].lifetime = 0;
        }
        // this.hitsplats = this.hitsplats.filter(e => e.lifetime > 0);

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
        const frameHeight = this.spriteframes[this.currentAnimation].getCurrentFrame().height;
        const scale = this.spriteframes[this.currentAnimation].scale.y;
        if (this.deathTimer === 0)
            this.drawHealthBar(context, (this.pos.x - xView + 2.5) * Game.scale, (this.pos.y - yView - (frameHeight * scale) - (10 * (1/Game.scale))) * Game.scale, this.currentHp, this.get("maxHp"));

        const hitsplatPositions = [
            {x: this.pos.x - xView, y: this.pos.y - yView - 8},
            {x: this.pos.x - xView, y: this.pos.y - yView - 16},
            {x: this.pos.x - xView + 8, y: this.pos.y - yView - 12}
        ]

        for (let i = 0; i < this.hitsplats.length; ++i) {
            if (this.hitsplats[i].lifetime > 0)
                this.drawHitsplat(context, hitsplatPositions[i].x * Game.scale, hitsplatPositions[i].y * Game.scale, this.hitsplats[i]);
        }

        if (this.chatMessage != "") {
            context.font = "12pt Consolas";
            context.textAlign = "center";
            context.fillStyle = "yellow"
            context.fillText(this.chatMessage, (this.pos.x - xView) * Game.scale, (this.pos.y - yView - frameHeight - (this.healthBarTimer > 0 ? 15 : 0)) * Game.scale);
        }

        context.restore();
    }

    NPC.prototype.drawHitsplat = function(context, x, y, hitsplat) {
        Game.SpriteManager.getSpriteFrameById(hitsplat.damageSpriteFrameId).draw(context, x, y);
        
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 16pt Consolas";
        context.fillText(hitsplat.damage, x, y);
    }

    NPC.prototype.processMovement = function(step) {
        const diffx = this.dest.x - this.pos.x;
        const diffy = this.dest.y - this.pos.y;
        
        let moving = false;
        if (Math.abs(diffx) > 1 || Math.abs(diffy) > 1) {
            const n = Math.getVectorNormal({x: diffx, y: diffy});
            if (Math.abs(n.x * step * this.speed) > Math.abs(diffx) || Math.abs(diffx) > 64)
                this.pos.x = this.dest.x;
            else
                this.pos.x += n.x * step * this.speed;
            
            if (Math.abs(n.y * step * this.speed) > Math.abs(diffy) || Math.abs(diffy) > 64)
                this.pos.y = this.dest.y;
            else
                this.pos.y += n.y * step * this.speed;

            const atan = Math.atan2(n.y, n.x);
            const d = ((atan > 0 ? atan : (2*Math.PI + atan)) * 360 / (2*Math.PI)) - 45;
            
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

        if (this.inCombat && Math.abs(this.dest.x - this.pos.x) < 1 && Math.abs(this.dest.y - this.pos.y) < 1)
            this.currentAnimation = "attack";

        if (moving || this.inCombat || this.getCurrentSpriteFrame().alwaysAnimate())
            this.spriteframes[this.currentAnimation].process(step);
        else
            this.spriteframes[this.currentAnimation].currentFrame = 1;
    }

    NPC.prototype.getCurrentSpriteFrame = function() {
        return this.spriteframes[this.currentAnimation];
    }

    NPC.prototype.setDestPosAndSpeedByTileId = function(tileId) {
        this.tileId = tileId;
        const xy = tileIdToXY(tileId);

        this.dest.x = xy.x + (this.inCombat ? this.combatOffset : 0);
        this.dest.y = xy.y;

        const diffx = this.dest.x - this.pos.x;
        const diffy = this.dest.y - this.pos.y;
        const mag = Math.getVectorMagnitude({x: diffx, y: diffy});
        this.speed = mag / 0.6;
    }

    NPC.prototype.handleNpcUpdate = function(obj) {
        if (obj.hasOwnProperty("hp")) {
            // set current hp
            this.currentHp = obj.hp;
        }

        if (obj.hasOwnProperty("tileId")) {
            if (obj.hasOwnProperty("snapToTile")) {
                // sometimes we don't want the player to walk to the tile (e.g. when we climb a ladder we always want to end up south of it immediately)
                let xy = tileIdToXY(obj.tileId);
                this.dest.x = xy.x;
                this.dest.y = xy.y;
                this.pos.x = xy.x;
                this.pos.y = xy.y;
            } else {
                if (!this.inCombat) // sometimes an npc has broadcasted a move message just before it gets into combat, which overwrites the combat location
                    this.setDestPosAndSpeedByTileId(obj.tileId);
            }
        }
        
        if (obj.hasOwnProperty("damage")) {
            const hitsplat = {
                damage: obj.damage,
                lifetime: 0.8,
                damageSpriteFrameId: obj.damageSpriteFrameId
            };
            if (this.hitsplats.length < 3)
                this.hitsplats.push(hitsplat);  
            else {
                let hitsplatToReplace = this.hitsplats.reduce(function(res, obj) {
                    return (obj.lifetime < res.lifetime) ? obj : res;
                });
                let idxReplaceHitsplat = this.hitsplats.map(e => e.lifetime).indexOf(hitsplatToReplace.lifetime);
                this.hitsplats[idxReplaceHitsplat] = hitsplat;
            }
            this.healthBarTimer = 5;
        }
    }

    NPC.prototype.drawHealthBar = function(ctx, x, y, currentHp, maxHp) {
        if (this.healthBarTimer === 0)
            return false;

        const barLength = 32;
        const currentHpLength = ~~(barLength * (currentHp/maxHp));

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