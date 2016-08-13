(function(){
		function Player(x, y){
			// (x, y) = center of object
			// ATTENTION:
			// it represents the player position on the world(room), not the canvas position
			this.x = x;
			this.y = y;				
			
			// move speed in pixels per second
			this.speed = 200;		
			
			// render properties
			this.width = 32;
			this.height = 32;
            this.stats = new Game.Stats();
            
            
            this.sprite = new Game.Sprite();
            this.sprite.anchor = {x: this.width/2, y: this.height};
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
			// check controls and move the player accordingly
			if(Game.controls.left) {
				this.x -= this.speed * step;
                this.stats.gainExp("str", 3);
                this.sprite.switchType("walkleft");
                moving = true;
            }
			if(Game.controls.up) {
				this.y -= this.speed * step;
                this.stats.gainExp("def", 3);
                this.sprite.switchType("walkup");
                moving = true;
            }
			if(Game.controls.right) {
				this.x += this.speed * step;
                this.stats.gainExp("agil", 3);
                this.sprite.switchType("walkright");
                moving = true;
            }
			if(Game.controls.down) {
				this.y += this.speed * step;	
                this.stats.gainExp("acc", 3);
                this.sprite.switchType("walkdown");
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
			// draw a simple rectangle shape as our player model
			context.save();
            context.fillStyle = "red";
            if (this.image) {
                this.sprite.draw(context, this.x - xView, this.y - yView, this.image);
            } else {
			     
			     // before draw we need to convert player world's position to canvas position			
			     context.fillRect(this.x- (this.width/2) - xView, (this.y-this.height) - yView, this.width, this.height);
                context.fillStyle = "white";
                context.fillRect(this.x - xView, this.y - yView, 2, 2);
            }
            context.fillText("pos: {x: {0}, y: {1}}".format(~~this.x, ~~this.y), 10, 20);
			context.restore();			
		}
		
		// add "class" Player to our Game object
		Game.Player = Player;
		
	})();