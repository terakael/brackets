(function() {
    function LogonScreen() {
    	this.username = '';
    	this.password = '';
    	this.logonState = 'username';
    	this.logonError = '';
    	this.logonErrorTimer = 0;
    }

    LogonScreen.prototype.process = function(dt) {
		if (this.logonErrorTimer > 0) {
			this.logonErrorTimer -= dt;
			if (this.logonErrorTimer < 0)
				this.logonErrorTimer = 0;
		}
	}

	LogonScreen.prototype.draw = function(ctx, w, h) {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, w, h);
		
		
		ctx.font = "15px Consolas";
		ctx.fillStyle = "white";
		
		if (this.logonState === 'username') {
			ctx.fillText("username: " + this.username + "*", 10, 15);
			ctx.fillText("password: ", 10, 35); 
		} else if (this.logonState === 'password') {
			ctx.fillText("username: " + this.username, 10, 15);
			ctx.fillText("password: *", 10, 35); 
		}
		
		if (this.logonErrorTimer > 0) {
			ctx.fillStyle = 'red';
			ctx.fillText(this.logonError, 10, 55);
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
		switch (keyCode) {
			case 32://space
				// quick login for dmk
				Game.ws.send({
					action: "logon",
					username: "dmk",
					password: "Password12"
				});
				break;
			case 13:// enter
				if (this.logonState === 'username') {
					this.logonState = 'password';
				} else if (this.logonState === 'password') {
					Game.ws.send({
						action: "logon",
						username: this.username,
						password: this.password
					});
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
		}
	}

    Game.LogonScreen = new LogonScreen();
})();