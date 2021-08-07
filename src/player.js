(function(){
		function Player(obj){
            this.id = obj.id;
            this.name = obj.name;

			// (x, y) = center of object
			// ATTENTION:
            // it represents the player position on the world(room), not the canvas position
            const posXY = tileIdToXY(obj.tileId);
			this.x = posXY.x;
			this.y = posXY.y;				
            this.destPos = posXY;
            this.inCombat = false;
			
			// move speed in pixels per second
			this.speed = 53.3;
			
			// render properties
			this.width = 32;
			this.height = 32;
            this.combatLevel = obj.combatLevel;
            this.chatMessage = "";// the text over the player's head
            this.chatMessageTimer = 0;// counter until the chat message is cleared
            this.clickBox = new Rectangle(0, 0, this.width, this.height);
            this.contextActions = ["follow", "trade", "duel"];
            this.hitsplats = [];
            this.currentHp = obj.currentHp;
            this.maxHp = obj.maxHp;
            this.currentPrayer = obj.currentPrayer || 0;
            this.respawnPos = {x: 0, y: 0};
            this.deathsCurtain = 1;
            this.deathSequence = false;
            this.actionBubbleSprite = null;
            this.actionBubbleTimer = 0;
            this.combatOffsetX = 0;

            this.spriteframes = new Map();// things that aren't base character parts (weapons/armour etc)
            this.baseframes = new Map();// base character parts; shows if you're not equipping anything
            this.currentAnimation = "down";
            
            this.attackStyles = {};
            this.attackStyle = 0;

            // draw orders
            // down: legs, body, head, offhand, onhand
            // up: head, body, legs, onhand, offhand
            // left/attack left: offhand, legs, body, head, onhand
            // right/attack right: onhand, legs, body, head, offhand
            // TODO: daggers should always be drawn on the top?
            this.drawOrders = new Map();
            this.drawOrders.set("down", ["CAPE","LEGS","PANTS","SHOES","LEGWEAR","TORSO","SHIRT","BODYWEAR","NECKLACE","HEAD","BEARD","HAIR","HEADWEAR","OFFHAND","ONHAND"]);
            this.drawOrders.set("up", ["LEGS","PANTS","SHOES","LEGWEAR","TORSO","SHIRT", "BEARD","HEAD","BODYWEAR", "HAIR","NECKLACE","CAPE","HEADWEAR", "ONHAND","OFFHAND"]);
            this.drawOrders.set("left", ["ONHAND","LEGS","PANTS","SHOES","LEGWEAR","TORSO","SHIRT","BODYWEAR","HEAD","CAPE","HAIR","NECKLACE","BEARD","HEADWEAR","OFFHAND"]);
            this.drawOrders.set("attack_left", ["ONHAND","LEGS","PANTS","SHOES","LEGWEAR","TORSO","SHIRT","BODYWEAR","HEAD","CAPE","HAIR","NECKLACE","BEARD","HEADWEAR","OFFHAND"]);
            this.drawOrders.set("right", ["OFFHAND","LEGS","PANTS","SHOES","LEGWEAR","TORSO","SHIRT","BODYWEAR","HEAD","CAPE","HAIR","NECKLACE","BEARD","HEADWEAR","ONHAND"]);
            this.drawOrders.set("attack_right", ["OFFHAND","LEGS","PANTS","SHOES","LEGWEAR","TORSO","SHIRT","BODYWEAR","HEAD","CAPE","HAIR","NECKLACE","BEARD","HEADWEAR","ONHAND"]);

            this.setAnimations(obj.baseAnimations);
            this.setEquipAnimations(obj.equipAnimations);
		}
		
		Player.prototype.process = function(step) {
            if (this.actionBubbleTimer > 0) {
                this.actionBubbleTimer -= step;
                if (this.actionBubbleTimer <= 0) {
                    this.actionBubbleSprite = null;
                    this.actionBubbleTimer = 0;
                }
            }
            
			// parameter step is the time between frames ( in seconds )
            let moving = false;
            
            if (!this.deathSequence) {
                // TODO try this out using the spell movement mechanics
                
                var diffx = this.destPos.x - this.x;
                var diffy = this.destPos.y - this.y;
                if (Math.abs(diffx) > 1 || Math.abs(diffy) > 1) {
                    var n = Math.getVectorNormal({x: diffx, y: diffy});
                    
                    if (Math.abs(n.x * step * this.speed) > Math.abs(diffx) || Math.abs(diffx) > 64)
                        this.x = this.destPos.x;
                    else
                        this.x += n.x * step * this.speed;
                    
                    if (Math.abs(n.y * step * this.speed) > Math.abs(diffy) || Math.abs(diffy) > 64)
                        this.y = this.destPos.y;
                    else
                        this.y += n.y * step * this.speed;

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
            }

            if (this.inCombat && Math.abs(this.destPos.x - this.x) < 1 && Math.abs(this.destPos.y - this.y) < 1) {
                // if you're attacking FROM the right, you should be facing left.
                this.currentAnimation = this.attackingFromRight ? "attack_left" : "attack_right";
            }
			
            if (this.chatMessageTimer > 0) {
                this.chatMessageTimer -= step;
                if (this.chatMessageTimer < 0) {
                    this.chatMessageTimer = 0;
                    this.chatMessage = "";
                }
            }

            if (this.deathSequence === true) {
                this.deathsCurtain -= step;
                if (this.deathsCurtain < 0) {
                    this.deathsCurtain = 0;
                }
            } else {
                if (this.deathsCurtainMaxTimer > 0) {
                    this.deathsCurtainMaxTimer -= step;
                    if (this.deathsCurtainMaxTimer < 0) {
                        this.deathsCurtainMaxTimer = 0;
                        // TODO move the client-player-only code elsewhere
                        if (this.id === Game.currentPlayer.id) {
                            ChatBox.add("You've been granted another life; use it wisely.", "white");
                        }
                    }
                } else {
                    if (this.deathsCurtain < 1) {
                        this.deathsCurtain += step;
                        if (this.deathsCurtain > 1)
                            this.deathsCurtain = 1;
                    }
                }
            }
            
            if (moving) {
                // only process one part of the player, then reflect the current frame through all the rest
                this.getBaseSpriteFrame().process(step);
                
            } else if (this.inCombat) {
                if (this.getBaseSpriteFrame().currentFrame > 0)
                    this.getBaseSpriteFrame().process(step);
            }
            else if (this.pendingFaceDirection) {
                this.currentAnimation = this.pendingFaceDirection;
                this.pendingFaceDirection = null;
            }

            let currentFrame = (moving || this.inCombat) ? this.getBaseSpriteFrame().currentFrame : 1;

            this.spriteframes.forEach((value, key, map) => {
                value[this.currentAnimation].currentFrame = currentFrame;
            });

            this.baseframes.forEach((value, key, map) => {
                value[this.currentAnimation].currentFrame = currentFrame;
            });

            if (this.stats)
                this.stats.process(step);

            if (this.inventory)
                this.inventory.process(step);

            let cumulativeHitsplatLifetime = 0;
            for (let i = 0; i < this.hitsplats.length; ++i) {
                cumulativeHitsplatLifetime += this.hitsplats[i].lifetime;
                this.hitsplats[i].lifetime -= step;
                if (this.hitsplats[i].lifetime < 0)
                    this.hitsplats[i].lifetime = 0;
            }
            if (cumulativeHitsplatLifetime <= 0)
                this.hitsplats = [];

            this.clickBox.setPos(this.x - this.width/2, this.y - this.height);
		}
		
		Player.prototype.draw = function(context, xView, yView) {
            if (this.deathSequence != true) {
                context.save()

                const scale = 0.5;
                context.scale(scale, scale);
                
                let healthBarOffset = this.inCombat ? (this.attackingFromRight ? 2.5 : -2.5) : 0;
                var showingHealthBar = this.stats.drawHealthBar(context, (this.x - xView + healthBarOffset) * (1/scale), (this.y - yView - this.height - (10 * (1/(1/scale)))) * (1/scale), Math.min(this.currentHp, this.maxHp), this.maxHp);
                if (this.chatMessage != "") {
                    context.font = "12pt customFont";
                    context.textAlign = "center";
                    context.fillStyle = "yellow"
                    context.fillText(this.chatMessage, (this.x - xView) * (1/scale), (this.y - yView - this.height - (showingHealthBar ? 15 : 0)) * (1/scale));
                }

                const hitsplatPositions = [
                    {x: this.x - xView, y: this.y - yView - 8},
                    {x: this.x - xView, y: this.y - yView - 16},
                    {x: this.x - xView + (8 * (this.attackingFromRight ? 1 : -1)), y: this.y - yView - 12}
                ]
        
                for (let i = 0; i < this.hitsplats.length; ++i) {
                    if (this.hitsplats[i].lifetime > 0)
                        this.drawHitsplat(context, hitsplatPositions[i].x * (1/scale), hitsplatPositions[i].y * (1/scale), this.hitsplats[i]);
                }

                if (this.actionBubbleTimer > 0) {
                    if (this.actionBubbleSprite != null) {
                        
                        context.save();
                        context.globalAlpha = 0.7;
                        // SpriteManager.getSpriteFrameById(555).draw(context, (this.x - xView) * gameScale, (this.y - yView - 32 - 8) * gameScale);
                        SpriteManager.getSpriteFrameById(555).draw(context, (this.x - xView) * (1/scale), (this.y - yView - 32 - 8) * (1/scale));
                        context.restore();

                        context.save();
                        const spriteScale = 0.7;
                        context.scale(spriteScale, spriteScale);

                        // 555 is the skill bubble sprite frame
                        this.actionBubbleSprite.draw(context, (this.x - xView) * ((1/scale)*(1/spriteScale)), (this.y - yView - 32 - 8) * ((1/scale)*(1/spriteScale)));
                        context.restore();
                    }
                }

                context.restore();
            }

            this.drawDeathSequence(context, xView, yView);
        }

        Player.prototype.drawHitsplat = function(context, x, y, hitsplat) {
            SpriteManager.getSpriteFrameById(hitsplat.damageSpriteFrameId).draw(context, x, y);
            
            context.fillStyle = "white";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = "bold 16pt customFont";
            context.fillText(hitsplat.damage, x, y);
        }

        Player.prototype.drawDeathSequence = function(context, xView, yView) {
            if (!this.deathSequence || this.id != Game.currentPlayer.id)
                return;
            
            context.save();
            context.fillStyle = "rgba(0, 0, 0, "+ (1-this.deathsCurtain) + ")";
            context.fillRect(0, 0, Game.worldCameraRect.width, Game.worldCameraRect.height);

            context.fillStyle = "rgba(255, 0, 0, "+ (1-this.deathsCurtain) + ")";
            context.textAlign = "center";
            context.font = "bold 40pt customFont";
            context.fillText("You died!", ~~(Game.worldCameraRect.width/2) * (1/Game.scale), ~~(Game.worldCameraRect.height/2) * (1/Game.scale));
            context.restore();
        }
        
        Player.prototype.getCurrentSpriteFrame = function(part) {
            if (this.spriteframes.has(part))
                return this.spriteframes.get(part)[this.currentAnimation];
            return this.getBaseSpriteFrame(part);
        }

        Player.prototype.getCurrentSpriteFrames = function() {
            let frames = [];

            this.drawOrders.get(this.currentAnimation).forEach(type => {
                if (this.baseframes.has(type))
                    frames.push(this.getBaseSpriteFrame(type));

                if (this.spriteframes.has(type)) {
                    frames.push(this.getCurrentSpriteFrame(type));
                }
            });      

            return frames;
        }

        Player.prototype.getBaseSpriteFrame = function(part) {
            return this.baseframes.get(part || "HEAD")[this.currentAnimation];
        }
        
        Player.prototype.loadStats = function(obj, boosts) {
            var stats = this.stats;
            Game.statMap.forEach(function(value, key, map) {
                stats.setExp(value, obj[key]);
                stats.setBoost(value, boosts[key]);
            });
        }

        Player.prototype.loadInventory = function(inv) {
            this.inventory.loadInventory(inv);
        }
        
        Player.prototype.setDestPos = function(pos) {
            this.destPos.x = ~~pos.x - (pos.x % 32) + 16;
            this.destPos.y = ~~pos.y - (pos.y % 32) + 16;
        }

        Player.prototype.setChatMessage = function(msg) {
            this.chatMessage = msg;
            this.chatMessageTimer = 3;
        }

        Player.prototype.contextMenuOptions = function() {
            var options = [];

            for (var i in this.contextActions) {
                options.push({
                    action: this.contextActions[i], 
                    objectId: this.id, 
                    objectName: this.name,
                    label: "{0} {1} (lvl {2})".format(this.contextActions[i], this.name, this.combatLevel)
                });
            }

            return options;
        }
		
        Player.prototype.setDeathSequence = function() {
            this.inCombat = false;
            this.deathSequence = true;
            this.deathsCurtainMaxTimer = 1;
            this.deathsCurtain = 1;
        }

        Player.prototype.updateInventory = function(invArray) {
            this.inventory.updateInventory(invArray);
        }

        Player.prototype.setEquippedSlots = function(equippedArray) {
            this.inventory.setEquippedSlots(equippedArray);
        }

        Player.prototype.setBonuses = function(bonuses) {
            this.stats.bonuses = bonuses;
        }

        Player.prototype.setAnimations = function(animations) {
            this.baseframes.clear(); // clear everything for a refresh
            
            for (let part in animations) {// head, torso, legs
                for (let type in animations[part]) {// up, down, left, right, attack
                    if (type === "color")
                        continue;
                    
                    if (!this.baseframes.has(part))
                        this.baseframes.set(part, []);
            
                    this.baseframes.get(part)[type] = new SpriteFrame(SpriteManager.getSpriteFrameById(animations[part][type]).frameData);
                    if (animations[part]["color"]) {
                        this.baseframes.get(part)[type].color = animations[part]["color"];
                    }
                }
            }
        }

        Player.prototype.setAnimation = function(part, animation) {
            this.baseframes.set(part, {}); // clear this part so we can reset it if it exists

            const {currentFrame, frameTimer, forwards} = this.getBaseSpriteFrame();
            
            for (let type in animation) {
                if (type === "color")
                    continue;

                if (animation[type] !== 0) {
                    this.baseframes.get(part)[type] = new SpriteFrame(SpriteManager.getSpriteFrameById(animation[type]).frameData);
                    if (animation["color"])
                        this.baseframes.get(part)[type].color = animation["color"];
                }
            }

            if (!Object.keys(this.baseframes.get(part)).length)
                this.baseframes.delete(part);
        }

        Player.prototype.setEquipAnimations = function(animations) {
            this.spriteframes.clear();// clear everything for a refresh

            for (let part in animations) {// head, torso, legs
                this.spriteframes.set(part, []);

                for (let type in animations[part]) {// up, down, left, right, attack
                    if (type === "color") {
                        continue;
                    }
                    this.spriteframes.get(part)[type] = new SpriteFrame(SpriteManager.getSpriteFrameById(animations[part][type]).frameData);
                    if (animations[part]["color"]) {
                        this.spriteframes.get(part)[type].color = animations[part]["color"];
                    }
                    // if (part === "ONHAND") {
                    //     this.spriteframes.get(part)[type].shadowColor = "yellow";
                    // }
                    this.spriteframes.get(part)[type].currentFrame=this.getBaseSpriteFrame().currentFrame;
                }
            }
        }

        Player.prototype.setDestPosAndSpeedByTileId = function(tileId, xOffset) {
            var xy = tileIdToXY(tileId);
            xy.x += xOffset || 0;

            this.combatOffsetX = xOffset || 0;

            this.attackingFromRight = xOffset > 0;
            
            this.destPos.x = xy.x;
            this.destPos.y = xy.y;

            var diffx = this.destPos.x - this.x;
            var diffy = this.destPos.y - this.y;
            var mag = Math.getVectorMagnitude({x: diffx, y: diffy});
            this.speed = mag / 0.6;
        }

        Player.prototype.handlePlayerUpdate = function(obj) {
            if (obj.hasOwnProperty("tileId") && !this.inCombat) {
                if (obj.hasOwnProperty("snapToTile")) {
                    // sometimes we don't want the player to walk to the tile (e.g. when we climb a ladder we always want to end up south of it immediately)
                    let xy = tileIdToXY(obj.tileId);
                    this.destPos.x = xy.x;
                    this.destPos.y = xy.y;
                    this.x = xy.x;
                    this.y = xy.y;

                    this.currentAnimation = "down";// on death, after respawn, animation isn't being reset
                } else {
                    this.setDestPosAndSpeedByTileId(obj.tileId);
                }
            }
            
            if (obj.hasOwnProperty("currentHp")) {
                // set current hp
                this.currentHp = obj.currentHp;

                this.stats.setBoost("hp", -this.maxHp + this.currentHp);
            }

            if (obj.hasOwnProperty("maxHp")) {
                // set current hp
                this.maxHp = obj.maxHp;
                this.stats.setBoost("hp", -this.maxHp + this.currentHp);
            }

            if (obj.hasOwnProperty("currentPrayer")) {
                this.currentPrayer = obj.currentPrayer;
                this.stats.setBoost("pray", -this.stats.getLevelByStat("pray") + this.currentPrayer);
            }

            if (obj.hasOwnProperty("combatLevel")) {
                this.combatLevel = obj.combatLevel;
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
                
                // damage hitsplat on top of the npc, set health bar timer
                this.stats.showHealthBar();
            }

            if (obj.hasOwnProperty("equipAnimations")) {
                this.setEquipAnimations(obj.equipAnimations);
            }

            if (obj.hasOwnProperty("baseAnimations")) {
                this.setAnimations(obj.baseAnimations);
            }

            if (obj.hasOwnProperty("respawn")) {
                this.deathSequence = false;
                this.combatOffsetX = 0;
            }

            if (obj.hasOwnProperty("faceDirection")) {
                this.pendingFaceDirection = obj.faceDirection;
            }

            if (obj.hasOwnProperty("doAttack")) {
                // just tells the client to start the attack animation.
                // the attack animation is a rubber-banding animation, which stops when it gets back to 0.
                // by setting it to 1, it triggers the full process and stops when we rubber-band back to teh start.
                this.getBaseSpriteFrame().currentFrame = 1;
                this.getBaseSpriteFrame().forwards = true;
            }
        }

        Player.prototype.loadAttackStyles = function(obj) {
            this.attackStyles = obj;
        }

        Player.prototype.setAttackStyle = function(id) {
            this.attackStyle = id;
        }

        Player.prototype.getCurrentAttackStyle = function() {
            return this.attackStyles[this.attackStyle];
        }

        Player.prototype.setActionBubble = function(sprite) {
            this.actionBubbleSprite = SpriteManager.getSpriteFrameById(sprite);
            this.actionBubbleTimer = 3;
        }

        Player.prototype.setInCombat = function(inCombat) {
            this.inCombat = inCombat;
            if (!this.inCombat) {
                this.currentAnimation = this.attackingFromRight ? "left" : "right";
            }
        }

		// add "class" Player to our Game object
		Game.Player = Player;
		
	})();