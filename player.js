(function(){
		function Player(x, y){
			// (x, y) = center of object
			// ATTENTION:
			// it represents the player position on the world(room), not the canvas position
			this.x = x;
			this.y = y;				
            this.destPos = {x: x, y: y};
            this.name = "null";
			
			// move speed in pixels per second
			this.speed = 200;		
			
			// render properties
			this.width = 32;
			this.height = 32;
            this.stats = new Game.Stats();
            this.inventory = new Game.Inventory();
            this.chatMessage = "";// the text over the player's head
            this.chatMessageTimer = 0;// counter until the chat message is cleared
            this.clickBox = new Game.Rectangle(0, 0, this.width, this.height);
            this.contextActions = ["follow", "trade", "duel"];
            this.hitSplat = 0;
            this.hitSplatTimer = 0;
            this.currentHp = 1;
            this.maxHp = 1;
            this.respawnPos = {x: 0, y: 0};
            this.deathsCurtain = 1;
            this.deathSequence = false;
            
            this.sprite = new Game.Sprite();
            this.sprite.anchor = {x: 0.5, y: 0.9};
            this.sprite.width = this.width;
            this.sprite.height = this.height;
            this.sprite.currentType = "walkdown";
            this.sprite.types = {
                walkdown: {
                    loop: "pingpong", 
                    forwards: 1,
                    speed: 0.1,
                    frames: [
                        {x:0, y:140, w:32, h:32},
                        {x:32, y:140, w:32, h:32},
                        {x:64, y:140, w:32, h:32}
                    ]
                },
                walkup: {
                    loop: "pingpong",
                    forwards: 1,
                    speed: 0.1,
                    frames: [
                        {x:0, y:204, w:32, h:32},
                        {x:32, y:204, w:32, h:32},
                        {x:64, y:204, w:32, h:32}
                    ]
                },
                walkleft: {
                    loop: "pingpong",
                    forwards: 1,
                    speed: 0.1,
                    frames: [
                        {x:0, y:172, w:32, h:32},
                        {x:32, y:172, w:32, h:32},
                        {x:64, y:172, w:32, h:32}
                    ]
                },
                walkright: {
                    loop: "pingpong",
                    forwards: 1,
                    speed: 0.1,
                    frames: [
                        {x:0, y:236, w:32, h:32},
                        {x:32, y:236, w:32, h:32},
                        {x:64, y:236, w:32, h:32}
                    ]
                }
            }
		}
		
		Player.prototype.process = function(step, worldWidth, worldHeight){
			// parameter step is the time between frames ( in seconds )
			var moving = false;
            
            var diffx = this.destPos.x - this.x;
            var diffy = this.destPos.y - this.y;
            
            if (Math.abs(diffx) > 1 || Math.abs(diffy) > 1) {
                var n = Math.getVectorNormal({x: diffx, y: diffy});
                if (Math.abs(n.x * step * this.speed) > Math.abs(diffx))
                    this.x = this.destPos.x;
                else
                    this.x += n.x * step * this.speed;
                
                if (Math.abs(n.y * step * this.speed) > Math.abs(diffy))
                    this.y = this.destPos.y;
                else
                    this.y += n.y * step * this.speed;
                
                var atan = Math.atan2(n.y, n.x);
                var d = (atan > 0 ? atan : (2*Math.PI + atan)) * 360 / (2*Math.PI);
                
                if (!Game.isometric)
                    d -= 45;// offset the angle slightly to adhere to non-isometric camera
                if (d >= 0 && d < 90) {
                    this.sprite.switchType("walkdown");
                } else if (d >= 90 && d < 180) {
                    this.sprite.switchType("walkleft");
                } else if (d >= 180 && d < 270) {
                    this.sprite.switchType("walkup");
                } else {
                    this.sprite.switchType("walkright");
                }
                moving = true;
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

            if (this.hitSplatTimer > 0) {
                this.hitSplatTimer -= step;
                if (this.hitSplatTimer < 0) {
                    this.hitSplatTimer = 0;
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
            
            if (moving)
                this.sprite.process(step);

            this.stats.process(step);
            this.inventory.process(step);

            this.clickBox.setPos(this.x - this.width/2, this.y - this.height);
		}
		
		Player.prototype.draw = function(context, xView, yView) {
            if (this.deathSequence != true) {
                context.fillStyle = "pink";
                if (this.image) {
                    this.sprite.draw(context, this.x - xView, this.y - yView, this.image);
                } else {
    			     
    			     // before draw we need to convert player world's position to canvas position			
    			    context.fillRect(this.x- (this.width/2) - xView, (this.y-this.height) - yView, this.width, this.height);
                    context.fillStyle = "white";
                    context.fillRect(this.x - xView, this.y - yView, 2, 2);
                }

                context.save()
                context.setTransform(1, 0, 0, 1, 0, 0);
                var showingHealthBar = this.stats.drawHealthBar(context, (this.x - xView) * Game.scale, (this.y - yView - this.height - (10 * (1/Game.scale))) * Game.scale, this.currentHp, this.maxHp);
                if (this.chatMessage != "") {
                    context.font = "12pt Consolas";
                    context.textAlign = "center";
                    context.fillStyle = "yellow"
                    context.fillText(this.chatMessage, (this.x - xView) * Game.scale, (this.y - yView - this.height - (showingHealthBar ? 15 : 0)) * Game.scale);
                }
                

                if (this.hitSplatTimer > 0) {

                    context.fillStyle = this.hitSplat == "0" ? "rgba(0, 200, 200, 0.5)" : "rgba(200, 0, 0, 0.5)";
                    context.fillRect(((this.x - xView) * Game.scale) - 16, ((this.y - yView) * Game.scale) - 16 - 10, 32, 32);

                    context.font = "bold 20pt Consolas";
                    context.fillStyle = "white";
                    context.textAlign = "center";
                    context.fillText(this.hitSplat, (this.x - xView) * Game.scale, (this.y - yView) * Game.scale);
                }


                context.restore();
            }

            context.fillStyle = "rgba(0, 0, 0, "+ (1-this.deathsCurtain) + ")";
            context.fillRect(0, 0, Game.worldCameraRect.width, Game.worldCameraRect.height);

            context.fillStyle = "rgba(255, 0, 0, "+ (1-this.deathsCurtain) + ")";
            context.textAlign = "center";
            context.font = "bold 40pt Consolas";
            context.fillText("You died!", ~~(Game.worldCameraRect.width/2) * (1/Game.scale), ~~(Game.worldCameraRect.height/2) * (1/Game.scale));
		}
        
        Player.prototype.loadStats = function(obj) {
            this.stats.setExp("str", obj["strength"]);
            this.stats.setExp("acc", obj["accuracy"]);
            this.stats.setExp("def", obj["defence"]);
            this.stats.setExp("agil", obj["agility"]);
            this.stats.setExp("hp", obj["hitpoints"]);
			this.stats.setExp("mage", obj["magic"]);
			this.stats.setExp("mine", obj["mining"]);
			this.stats.setExp("smith", obj["smithing"]);
			this.stats.setExp("herb", obj["herblore"]);
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
                options.push({action: this.contextActions[i], objectId: this.id, objectName: this.name});
            }

            return options;
        }

        Player.prototype.damage = function(dmg) {
            this.hitSplat = dmg;
            this.hitSplatTimer = 1;
            this.stats.showHealthBar();
            this.currentHp -= dmg;

            if (this.currentHp <= 0) {
                this.currentHp = this.maxHp;
            }

            this.stats.currentHp = this.currentHp;// for drawing it in the stat bar
        }

        Player.prototype.respawn = function(x, y, hp) {
            this.respawnPos.x = x;
            this.respawnPos.y = y;
            this.currentHp = hp;
            this.maxHp = hp;
            this.stats.currentHp = hp;
        }
		
        Player.prototype.setDeathSequence = function() {
            this.deathSequence = true;
            this.deathsCurtainMaxTimer = 1;
        }

        Player.prototype.updateInventory = function(invArray) {
            this.inventory.updateInventory(invArray);
        }

		// add "class" Player to our Game object
		Game.Player = Player;
		
	})();