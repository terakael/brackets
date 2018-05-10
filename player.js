(function(){
		function Player(x, y){
			// (x, y) = center of object
			// ATTENTION:
			// it represents the player position on the world(room), not the canvas position
			this.x = x;
			this.y = y;				
            this.destPos = {x: x, y: y};
			
			// move speed in pixels per second
			this.speed = 200;		
			
			// render properties
			this.width = 32;
			this.height = 32;
            this.stats = new Game.Stats();
            this.inventory = new Game.Inventory();
            
            
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
            
            if (moving)
                this.sprite.process(step);
		}
		
		Player.prototype.draw = function(context, xView, yView){		
			context.save();
            context.fillStyle = "pink";
            if (this.image) {
                this.sprite.draw(context, this.x - xView, this.y - yView, this.image);
            } else {
			     
			     // before draw we need to convert player world's position to canvas position			
			    context.fillRect(this.x- (this.width/2) - xView, (this.y-this.height) - yView, this.width, this.height);
                context.fillStyle = "white";
                context.fillRect(this.x - xView, this.y - yView, 2, 2);
            }
			context.restore();			
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
        
        Player.prototype.setDestPos = function(pos) {
            this.destPos.x = ~~pos.x - (pos.x % 32) + 16;
            this.destPos.y = ~~pos.y - (pos.y % 32) + 16;
        }
		
		// add "class" Player to our Game object
		Game.Player = Player;
		
	})();