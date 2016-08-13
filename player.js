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
		}
		
		Player.prototype.process = function(step, worldWidth, worldHeight){
			// parameter step is the time between frames ( in seconds )
			
			// check controls and move the player accordingly
			if(Game.controls.left) {
				this.x -= this.speed * step;
                this.stats.gainExp("str", 1);
            }
			if(Game.controls.up)
				this.y -= this.speed * step;
			if(Game.controls.right)
				this.x += this.speed * step;
			if(Game.controls.down)
				this.y += this.speed * step;		
			
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
		}
		
		Player.prototype.draw = function(context, xView, yView){		
			// draw a simple rectangle shape as our player model
			context.save();
            context.fillStyle = "red";
            if (this.image) {
                context.drawImage(this.image, 
                                  32,
                                  140, 
                                  32, 
                                  32, 
                                  (this.x-this.width/2) - xView, 
                                  (this.y-this.height) - yView, 
                                  this.width, 
                                  this.height);
            } else {
			     
			     // before draw we need to convert player world's position to canvas position			
			     context.fillRect((this.x-this.width/2) - xView, (this.y-this.height) - yView, this.width, this.height);
            }
            context.fillText("pos: {x: {0}, y: {1}}".format(~~this.x, ~~this.y), 10, 20);
			context.restore();			
		}
		
		// add "class" Player to our Game object
		Game.Player = Player;
		
	})();