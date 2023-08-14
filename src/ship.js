(function(){
    function Ship(obj){
        const ship = Game.shipMap.get(obj.hullSceneryId);
        console.log(ship);

        this.tileId = obj.tileId;
        const xy = tileIdToXY(obj.tileId);
        this.id = ship.id,
        this.instanceId = obj.captainId;// ship instance id is the captain player id
        this.pos = {x: xy.x, y: xy.y};
        this.dest = {x: xy.x, y: xy.y};
        this.speed = 0;
        this.remainingTicks = obj.remainingTicks;
        this.healthBarTimer = 0;
        this.hitsplats = [];
        this.inCombat = false;
        this.chatMessage = "";
        this.chatMessageTimer = 0;
        this.deathTimer = 0;

        this.spriteframes = [];
        this.spriteframes["up"] = new SpriteFrame(SpriteManager.getSpriteFrameById(ship.upId).frameData);
        // this.spriteframes["up"].setScale({x: ship.scaleX, y: ship.scaleY});
        
        this.spriteframes["down"] = new SpriteFrame(SpriteManager.getSpriteFrameById(ship.downId).frameData);
        // this.spriteframes["down"].setScale({x: ship.scaleX, y: ship.scaleY});
        
        this.spriteframes["left"] = new SpriteFrame(SpriteManager.getSpriteFrameById(ship.leftId).frameData);
        // this.spriteframes["left"].setScale({x: ship.scaleX, y: ship.scaleY});
        
        this.spriteframes["right"] = new SpriteFrame(SpriteManager.getSpriteFrameById(ship.rightId).frameData);
        // this.spriteframes["right"].setScale({x: ship.scaleX, y: ship.scaleY});

        // this.spriteframes["attack"] = new SpriteFrame(SpriteManager.getSpriteFrameById(ship.attackId).frameData);
        // this.spriteframes["attack"].setScale({x: ship.scaleX, y: ship.scaleY});

        // this.combatOffset = (this.spriteframes["attack"].getCurrentFrame().width * ship.scaleX) / 4;

        // just to avoid all the ships facing the same direction at the start
        // const potentialStartAnimations = ["up", "down", "left", "right"];
        // this.currentAnimation = potentialStartAnimations[Math.floor(Math.random() * potentialStartAnimations.length)];
        this.currentAnimation = "down";
    }

    Ship.prototype.getTileId = function() {
        return xyToTileId(this.pos.x, this.pos.y);
    }

    Ship.prototype.getLeftclickLabel = function() {
        if (this.get("leftclickOption") === 1) {// attack
            return `attack ${this.get("name")} (lvl ${this.get("cmb")})`;
        }
        return "";
    }
    
    Ship.prototype.process = function(step){
        // if (this.currentHp == 0) {
        //     this.deathTimer += step;
        // } else {
        //     this.deathTimer = 0;
        // }

        if (this.deathTimer === 0)
            this.processMovement(step);

        if (this.healthBarTimer > 0) {
            this.healthBarTimer -= step;
            if (this.healthBarTimer < 0)
                this.healthBarTimer = 0;
        }

        let cumulativeHitsplatLifetime = 0;
        for (let i = 0; i < this.hitsplats.length; ++i) {
            cumulativeHitsplatLifetime += this.hitsplats[i].lifetime;
            this.hitsplats[i].lifetime -= step;
            if (this.hitsplats[i].lifetime < 0)
                this.hitsplats[i].lifetime = 0;
        }
        if (cumulativeHitsplatLifetime <= 0)
            this.hitsplats = [];

        if (this.chatMessageTimer > 0) {
            this.chatMessageTimer -= step;
            if (this.chatMessageTimer <= 0) {
                this.chatMessageTimer = 0;
                this.chatMessage = "";
            }
        }
    }
    
    Ship.prototype.draw = function(context, xView, yView) {
        // the sprite itself is drawn in the main room via the drawMap.
        // we still draw hitsplats and health bar here though.
        context.save();
        // context.setTransform(1, 0, 0, 1, 0, 0);

        const scale = 0.5;
        context.scale(scale, scale);
        
        const frameHeight = this.spriteframes[this.currentAnimation].getCurrentFrame().height;
        const frameScale = this.spriteframes[this.currentAnimation].scale.y;
        if (this.deathTimer === 0)
            this.drawHealthBar(context, (this.pos.x - xView + 2.5) * (1/scale), (this.pos.y - yView - (frameHeight * frameScale) - (10 * (1/(1/scale)))) * (1/scale), this.currentHp, this.get("maxHp"));

        const hitsplatPositions = [
            {x: this.pos.x - xView, y: this.pos.y - yView - 8},
            {x: this.pos.x - xView, y: this.pos.y - yView - 20},
            {x: this.pos.x - xView + 12, y: this.pos.y - yView - 14}
        ]

        for (let i = 0; i < this.hitsplats.length; ++i) {
            if (this.hitsplats[i].lifetime > 0)
                this.drawHitsplat(context, hitsplatPositions[i].x * (1/scale), hitsplatPositions[i].y * (1/scale), this.hitsplats[i]);
        }

        if (this.chatMessage != "") {
            context.font = "12pt customFont";
            context.textAlign = "center";
            context.fillStyle = "yellow"
            context.fillText(this.chatMessage, (this.pos.x - xView) * (1/scale), (this.pos.y - yView - (frameHeight * frameScale) - (this.healthBarTimer > 0 ? 10 : 0)) * (1/scale));
        }

        context.restore();
    }

    Ship.prototype.drawHitsplat = function(context, x, y, hitsplat) {
        SpriteManager.getSpriteFrameById(hitsplat.damageSpriteFrameId).draw(context, x, y);
        
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 16pt customFont";
        context.fillText(hitsplat.damage, x, y);
    }

    Ship.prototype.processMovement = function(step) {
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

        // if (moving || this.getCurrentSpriteFrame().alwaysAnimate())
        //     this.spriteframes[this.currentAnimation].process(step);
        // else if (this.inCombat) {
        //     if (this.spriteframes[this.currentAnimation].currentFrame > 0)
        //         this.spriteframes[this.currentAnimation].process(step);
        // }
        // else
            // this.spriteframes[this.currentAnimation].currentFrame = 1;
    }

    Ship.prototype.getCurrentSpriteFrame = function() {
        return this.spriteframes[this.currentAnimation];
    }

    Ship.prototype.setDestPosAndSpeedByTileId = function(tileId) {
        this.tileId = tileId;
        const xy = tileIdToXY(tileId);

        this.dest.x = xy.x + (this.inCombat ? this.combatOffset : 0);
        this.dest.y = xy.y;

        const diffx = this.dest.x - this.pos.x;
        const diffy = this.dest.y - this.pos.y;
        const mag = Math.getVectorMagnitude({x: diffx, y: diffy});
        this.speed = mag / 0.5;
    }

    Ship.prototype.handleUpdate = function(obj) {
        if (obj.hasOwnProperty("tileId")) {
            this.setDestPosAndSpeedByTileId(obj.tileId);
        }
    }

    Ship.prototype.drawHealthBar = function(ctx, x, y, currentHp, maxHp) {
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

    Ship.prototype.setChatMessage = function(message) {
        this.chatMessage = message;
        this.chatMessageTimer = 3;
    }

    Ship.prototype.get = function(val) {
        return Game.shipMap.get(this.id)[val];
    }

    
    Game.Ship = Ship;		
})();