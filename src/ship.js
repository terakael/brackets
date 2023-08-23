(function(){
    function Ship(obj){
        const ship = Game.shipMap.get(obj.hullSceneryId);

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
        this.maxHp = obj.maxHp;
        this.maxArmour = obj.maxArmour;
        
        this.actionBubbles = new Map();

        this.spriteframes = [];
        this.spriteframes["up"] = new SpriteFrame(SpriteManager.getSpriteFrameById(ship.upId).frameData);
        this.spriteframes["down"] = new SpriteFrame(SpriteManager.getSpriteFrameById(ship.downId).frameData);
        this.spriteframes["left"] = new SpriteFrame(SpriteManager.getSpriteFrameById(ship.leftId).frameData);
        this.spriteframes["right"] = new SpriteFrame(SpriteManager.getSpriteFrameById(ship.rightId).frameData);

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

        this.actionBubbles.forEach((value, key, map) => {
            const newVal = {spriteId: value.spriteId, timeout: value.timeout - step};
            if (newVal.timeout <= 0) {
                map.delete(key);
            } else {
                map.set(key, newVal);
            }
        });

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
            this.drawHealthBar(context, 
                (this.pos.x - xView + 2.5) * (1/scale), 
                (this.pos.y - yView - ((frameHeight/2) * frameScale)) * (1/scale), 
                this.currentHp, this.maxHp, 
                this.currentArmour, this.maxArmour);

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
            context.fillText(this.chatMessage, (this.pos.x - xView) * (1/scale), (this.pos.y - yView - ((frameHeight/2) * frameScale) - (this.healthBarTimer > 0 ? 10 : 0)) * (1/scale));
        }

        if (this.actionBubbles.size) {
            context.save();
            context.globalAlpha = 0.7;
            for (let i = 0; i < this.actionBubbles.size; ++i) {
                const offset = -((this.actionBubbles.size / 2) * 16) + (i * 16) + 8;
                SpriteManager.getSpriteFrameById(555).draw(context, (this.pos.x - xView + offset) * (1/scale), (this.pos.y - yView - (frameHeight/2) - 8) * (1/scale));
            }
            context.restore();

            context.save();
            const spriteScale = 0.7;
            context.scale(spriteScale, spriteScale);

            // 555 is the skill bubble sprite frame
            for (let i = 0; i < this.actionBubbles.size; ++i) {
                const offset = -((this.actionBubbles.size / 2) * 16) + (i * 16) + 8;
                SpriteManager.getSpriteFrameById(this.actionBubbles.get(Array.from(this.actionBubbles.keys())[i]).spriteId).draw(context, (this.pos.x - xView + offset) * ((1/scale)*(1/spriteScale)), (this.pos.y - yView - (frameHeight/2) - 8) * ((1/scale)*(1/spriteScale)));
            }
            context.restore();
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
        }
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
            this.healthBarTimer = 3;
        }

        if (obj.hasOwnProperty("hp")) {
            this.currentHp = obj.hp;
        }

        if (obj.hasOwnProperty("armour")) {
            this.currentArmour = obj.armour;
        }
    }

    Ship.prototype.drawHealthBar = function(ctx, x, y, currentHp, maxHp, currentArmour, maxArmour) {
        if (this.healthBarTimer === 0)
            return false;

        const barLength = 32;
        let offset = 2.5;
        
        if (maxArmour > 0) {
            const currentArmourLength = ~~(barLength * (currentArmour/maxArmour));

            ctx.fillStyle = "#888";
            ctx.fillRect(x - ~~(barLength/2), y - offset, currentArmourLength, 5);

            ctx.fillStyle = "#ccc";
            ctx.fillRect(x - ~~(barLength/2) + currentArmourLength, y - offset, barLength - currentArmourLength, 5);

            offset += 5;
        }
        
        const currentHpLength = ~~(barLength * (currentHp/maxHp));

        ctx.fillStyle = "#0f0";
        ctx.fillRect(x - ~~(barLength/2), y - offset, currentHpLength, 5);

        ctx.fillStyle = "#f00";
        ctx.fillRect(x - ~~(barLength/2) + currentHpLength, y - offset, barLength - currentHpLength, 5);

        
        return true;
    }

    Ship.prototype.setChatMessage = function(message) {
        this.chatMessage = message;
        this.chatMessageTimer = 3;
    }

    Ship.prototype.get = function(val) {
        return Game.shipMap.get(this.id)[val];
    }

    Ship.prototype.setActionBubble = function(spriteId, playerId) {
        this.actionBubbles.set(playerId, {spriteId, timeout: 3});
        console.log(this.actionBubbles);
    }

    
    Game.Ship = Ship;		
})();