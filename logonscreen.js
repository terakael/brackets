(function() {
    function LogonScreen() {
		this.reset();
		this.bkg = null;
		this.loading = true;// on start it's loading, loading gets toggled off after the resources are loaded
	}
	
	LogonScreen.prototype.reset = function() {
		this.username = '';
    	this.password = '';
    	this.logonState = 'username';
    	this.logonError = '';
    	this.logonErrorTimer = 0;
    	this.loading = false;
	}

    LogonScreen.prototype.process = function(dt) {
		this.timer += dt;
		if (this.logonErrorTimer > 0) {
			this.logonErrorTimer -= dt;
			if (this.logonErrorTimer < 0)
				this.logonErrorTimer = 0;
		}
	}

	LogonScreen.prototype.draw = function(ctx, w, h) {
		if (!this.bkg)
			this.generate(1920, 1080);
		ctx.drawImage(this.bkg, 0, 0, w, h, 0, 0, w, h);

		ctx.fillStyle = "white";
		ctx.font = "30px customFont";
		ctx.textAlign = "center";
		ctx.fillText("danscape", ~~(w/2), ~~(h/2) - 60);

		ctx.fillStyle = "#333";
		ctx.fillRect(~~(w/2)-150, ~~(h/2)-30, 300, 55);

		ctx.strokeStyle = "rgb(255, {0}, {0})".format(255*(1-Math.min(this.logonErrorTimer, 1)));
		ctx.strokeRect(~~(w/2)-150.5, ~~(h/2)-30.5, 300, 55);
		
		ctx.font = "15px customFont";
		ctx.textAlign = "left";
		ctx.fillStyle = "white";

		let usernameField = "username: {0}{1}".format(this.username, (this.logonState === 'username' && !this.loading) ? '*' : '');
		let passwordField = "password: {0}{1}".format("x".repeat(this.password.length), (this.logonState === 'password' && !this.loading) ? '*' : '');		

		ctx.fillText(usernameField, ~~(w/2)-140, ~~(h/2)-10);
		ctx.fillText(passwordField, ~~(w/2)-140, ~~(h/2)+10);

		if (this.loading) {
			ctx.fillStyle = "white";
			ctx.textAlign = 'center';
			ctx.fillText(this.loadingText || "loading...", ~~(w/2), ~~(h/2) + 50);	
		} else if (this.logonErrorTimer > 0) {
			ctx.fillStyle = 'rgba(255, 0, 0, ' + this.logonErrorTimer + ")";
			ctx.textAlign = 'center';
			ctx.fillText(this.logonError, ~~(w/2), ~~(h/2) + 50);
		}
	}

	LogonScreen.prototype.onKeyPress = function(inp) {
		if (this.logonState === 'username') {
			if (/[a-zA-Z0-9]/.test(inp)) {
				if (this.username.length < 16)
					this.username += inp;
				return;
			}
		} else if (this.logonState === 'password') {
			if (/[a-zA-Z0-9]/.test(inp)) {
				if (this.password.length < 16)
					this.password += inp;
				return;
			}
		}
	}

	LogonScreen.prototype.onKeyDown = function(keyCode) {
		if (this.loading)
			return;

		switch (keyCode) {
			case 32://space
				this.connectAndLogin("god", "hi");
				break;
			case 13:// enter
				if (this.logonState === 'username') {
					this.logonState = 'password';
				} else if (this.logonState === 'password') {
					this.connectAndLogin(this.username, this.password);
				}
				break;
			case 8: // backspace
				if (this.logonState === 'username') {
					if (this.username.length > 0)
						this.username = this.username.substring(0, this.username.length - 1);
				} else if (this.logonState === 'password') {
					if (this.password.length > 0)
						this.password = this.password.substring(0, this.password.length - 1);
				}
				break;
			case 9: // tab
				this.logonState = this.logonState === 'username' ? 'password' : 'username';
				break;
		}
	}

	LogonScreen.prototype.setError = function(error) {
		this.loading = false;
		this.logonErrorTimer = 5;
        this.logonError = error;
	}

	LogonScreen.prototype.generate = function(width, height){
        var ctx = document.createElement("canvas").getContext("2d");		
        ctx.canvas.width = width;
        ctx.canvas.height = height;		

        var rows = ~~(width/32) + 1;
        var columns = ~~(height/32) + 1;
        ctx.save();			
        for (var x = 0, i = 0; i < rows; x+=32, i++) {	
            for (var y = 0, j=0; j < columns; y+=32, j++) {
                var val = Math.getRandom(50, 100);
                ctx.fillStyle = "rgb({0}, {1}, {2})".format(~~(val/3), ~~(val/3), ~~(val/3));
                ctx.fillRect (x, y, 32, 32);
            }		
        }
        ctx.restore();	

        // store the generate map as this image texture
        this.bkg = new Image();
        this.bkg.src = ctx.canvas.toDataURL("image/png");

        // clear context
        ctx = null;
    }

	LogonScreen.prototype.connectAndLogin = function(username, password) {
        this.loading = true;
        this.loadingText = "logging in...";
		let that = this;
                    
        Game.ws = new GameWebSocket(Game.ip, Game.port, "game", responses => {
            Game.responseQueue.push(...responses.filter(e => e.success));
            responses.filter(e => !e.success).forEach(e => {
                if (Game.state === 'logonscreen') {
                    that.setError(e.responseText);
                }
                else {
                    Game.ChatBox.add(e.responseText);
                }
            });
        });

        Game.ws.ws.onopen = function() {
            Game.ws.send({
                action: "logon",
                name: username,
                password: password
            });
        };

        Game.ws.ws.onclose = function() {
            Game.Room.otherPlayers = [];
            Game.currentPlayer = null;
            document.title = 'danscape';
            if (Game.state !== 'logonscreen') {
                Game.state = 'logonscreen';
                that.reset();
            }
            console.log("server closed connection");
        }

        Game.ws.ws.onerror = function() {
            if (Game.state === 'logonscreen') {
                that.setError("Error connecting to server.")
            }
        }
    };

    Game.LogonScreen = new LogonScreen();
})();