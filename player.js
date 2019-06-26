(function(){
		function Player(tileId){
			// (x, y) = center of object
			// ATTENTION:
            // it represents the player position on the world(room), not the canvas position
            var posXY = tileIdToXY(tileId);
			this.x = posXY.x;
			this.y = posXY.y;				
            this.destPos = posXY;
            this.name = "null";
            this.inCombat = false;
			
			// move speed in pixels per second
			this.speed = 53.3;
			
			// render properties
			this.width = 32;
			this.height = 32;
            this.stats = new Game.Stats();
            this.combatLevel = 0;
            this.inventory = new Game.Inventory();
            this.chatMessage = "";// the text over the player's head
            this.chatMessageTimer = 0;// counter until the chat message is cleared
            this.clickBox = new Game.Rectangle(0, 0, this.width, this.height);
            this.contextActions = ["follow", "trade", "duel"];
            this.hitsplat = null;
            this.currentHp = 1;
            this.maxHp = 1;
            this.respawnPos = {x: 0, y: 0};
            this.deathsCurtain = 1;
            this.deathSequence = false;

            this.spriteframes = new Map();// things that aren't base character parts (weapons/armour etc)
            this.baseframes = new Map();// base character parts; shows if you're not equipping anything
            this.currentAnimation = "down";
            
            this.attackStyles = {};
            this.attackStyle = 0;
		}
		
		Player.prototype.process = function(step, worldWidth, worldHeight){
			// parameter step is the time between frames ( in seconds )
			var moving = false;
            
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

            if (this.inCombat && Math.abs(this.destPos.x - this.x) < 1 && Math.abs(this.destPos.y - this.y) < 1) {
                // if you're attacking FROM the right, you should be facing left.
                this.currentAnimation = this.attackingFromRight ? "attack_left" : "attack_right";
            }
			
			// don't let player leaves the world's boundary
			if(this.x - this.width/2 < 0){
				this.x = this.width/2;
			}
			if(this.y - this.height/2 < 0){
				this.y = this.height/2;
			}
			if(this.x + this.width/2 > worldWidth){
				this.x = worldWidth - this.width/2;
			}
			if(this.y > worldHeight){
				this.y = worldHeight;
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
                    this.deathSequence = false;
                    this.x = this.respawnPos.x;
                    this.y = this.respawnPos.y;
                    this.destPos.x = this.respawnPos.x;
                    this.destPos.y = this.respawnPos.y;
                }
            } else {
                if (this.deathsCurtainMaxTimer > 0) {
                    this.deathsCurtainMaxTimer -= step;
                    if (this.deathsCurtainMaxTimer < 0) {
                        this.deathsCurtainMaxTimer = 0;
                        Game.ChatBox.add("You've been granted another life; use it wisely.", "white");
                    }
                } else {
                    if (this.deathsCurtain < 1) {
                        this.deathsCurtain += step;
                        if (this.deathsCurtain > 1)
                            this.deathsCurtain = 1;
                    }
                }
            }
            
            if (moving || this.inCombat) {
                let current = this.currentAnimation;

                // only process one part of the player, then reflect the current frame through all the rest
                this.getBaseSpriteFrame().process(step);
                let currentFrame = this.getBaseSpriteFrame().currentFrame;

                this.spriteframes.forEach((value, key, map) => {
                    value[current].currentFrame = currentFrame;
                });

                this.baseframes.forEach((value, key, map) => {
                    value[current].currentFrame = currentFrame;
                });
            }

            this.stats.process(step);
            this.inventory.process(step);

            if (this.hitsplat) {
                this.hitsplat.lifetime -= step;
                if (this.hitsplat.lifetime <= 0)
                    this.hitsplat = null;
            }

            this.clickBox.setPos(this.x - this.width/2, this.y - this.height);
		}
		
		Player.prototype.draw = function(context, xView, yView) {
            if (this.deathSequence != true) {
                context.save()
                context.setTransform(1, 0, 0, 1, 0, 0);
                let healthBarOffset = this.inCombat ? (this.attackingFromRight ? 2.5 : -2.5) : 0;
                var showingHealthBar = this.stats.drawHealthBar(context, (this.x - xView + healthBarOffset) * Game.scale, (this.y - yView - this.height - (10 * (1/Game.scale))) * Game.scale, this.currentHp, this.maxHp);
                if (this.chatMessage != "") {
                    context.font = "12pt Consolas";
                    context.textAlign = "center";
                    context.fillStyle = "yellow"
                    context.fillText(this.chatMessage, (this.x - xView) * Game.scale, (this.y - yView - this.height - (showingHealthBar ? 15 : 0)) * Game.scale);
                }

                if (this.hitsplat) {
                    context.fillStyle = this.hitsplat.damage == 0 ? "rgba(0, 0, 255, 0.5)" : "rgba(255, 0, 0, 0.5)";
                    context.fillRect((this.x - xView - 8) * Game.scale, (this.y - yView - 8) * Game.scale, 16 * Game.scale, 16 * Game.scale);
                    
                    context.fillStyle = "white";
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.font = "bold 20pt Consolas";
                    context.fillText(this.hitsplat.damage, (this.x - xView) * Game.scale, (this.y - yView) * Game.scale);
                }

                context.restore();
            }

            this.drawDeathSequence(context, xView, yView);
        }

        Player.prototype.drawDeathSequence = function(context, xView, yView) {
            if (!this.deathSequence)
                return;
            
            context.save();
            context.fillStyle = "rgba(0, 0, 0, "+ (1-this.deathsCurtain) + ")";
            context.fillRect(0, 0, Game.worldCameraRect.width, Game.worldCameraRect.height);

            context.fillStyle = "rgba(255, 0, 0, "+ (1-this.deathsCurtain) + ")";
            context.textAlign = "center";
            context.font = "bold 40pt Consolas";
            context.fillText("You died!", ~~(Game.worldCameraRect.width/2) * (1/Game.scale), ~~(Game.worldCameraRect.height/2) * (1/Game.scale));
            context.restore();
        }
        
        Player.prototype.getCurrentSpriteFrame = function(part) {
            if (this.spriteframes.has(part))
                return this.spriteframes.get(part)[this.currentAnimation];
            return this.getBaseSpriteFrame(part);
        }

        Player.prototype.getCurrentSpriteFrames = function() {
            let frames = [
                this.getCurrentSpriteFrame("HEAD"),
                this.getCurrentSpriteFrame("TORSO"),
                this.getCurrentSpriteFrame("LEGS")
            ];

            let otherFrames = ["ONHAND", "OFFHAND"];
            for (let i = 0; i < otherFrames.length; ++i) {
                if (this.spriteframes.has(otherFrames[i])) {
                    frames.push(this.getCurrentSpriteFrame(otherFrames[i]));
                }
            }

            return frames;
        }

        Player.prototype.getBaseSpriteFrame = function(part) {
            return this.baseframes.get(part || "HEAD")[this.currentAnimation];
        }
        
        Player.prototype.loadStats = function(obj) {
            var stats = this.stats;
            Game.statMap.forEach(function(value, key, map) {
                stats.setExp(value, obj[key]);
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

        Player.prototype.respawn = function(tileId, hp) {
            var xy = tileIdToXY(tileId);
            this.respawnPos.x = xy.x;
            this.respawnPos.y = xy.y;
            this.currentHp = hp;
            this.maxHp = hp;
            this.stats.bonuses = null;
        }
		
        Player.prototype.setDeathSequence = function() {
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
            for (let part in animations) {// head, torso, legs
                for (let type in animations[part]) {// up, down, left, right, attack
                    if (!this.baseframes.has(part))
                        this.baseframes.set(part, []);
            
                    this.baseframes.get(part)[type] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(animations[part][type]).frameData);
                }
            }
        }

        Player.prototype.setEquipAnimations = function(animations) {
            this.spriteframes.clear();// clear everything for a refresh

            for (let part in animations) {// head, torso, legs
                this.spriteframes.set(part, []);

                for (let type in animations[part]) {// up, down, left, right, attack
                    this.spriteframes.get(part)[type] = new Game.SpriteFrame(Game.SpriteManager.getSpriteFrameById(animations[part][type]).frameData);
                    this.spriteframes.get(part)[type].currentFrame=this.getBaseSpriteFrame().currentFrame;
                }
            }
        }

        Player.prototype.setDestPosAndSpeedByTileId = function(tileId, xOffset) {
            var xy = tileIdToXY(tileId);
            xy.x += xOffset || 0;

            this.attackingFromRight = xOffset > 0;
            
            this.destPos.x = xy.x;
            this.destPos.y = xy.y;

            var diffx = xy.x - this.x;
            var diffy = xy.y - this.y;
            var mag = Math.getVectorMagnitude({x: diffx, y: diffy});
            this.speed = mag / 0.6;
        }

        Player.prototype.handlePlayerUpdate = function(obj) {
            if (obj.hasOwnProperty("tile") && !this.inCombat)
                this.setDestPosAndSpeedByTileId(obj.tile);
            
            if (obj.hasOwnProperty("hp")) {
                // set current hp
                this.currentHp = obj.hp;
            }

            if (obj.hasOwnProperty("cmb")) {
                this.combatLevel = obj.cmb;
            }

            if (obj.hasOwnProperty("damage")) {
                // damage hitsplat on top of the npc, set health bar timer
                this.stats.showHealthBar();
                this.hitsplat = {
                    damage: obj.damage,
                    lifetime: 1
                };
            }

            if (obj.hasOwnProperty("equipAnimations")) {
                this.setEquipAnimations(obj.equipAnimations);
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

		// add "class" Player to our Game object
		Game.Player = Player;
		
	})();