(function() {
	function FightManager() {
		this.fights = [];
	};

	FightManager.prototype.draw = function(ctx, xview, yview) {
		for (var i in this.fights) {
			this.fights[i].fighter1.draw(ctx, xview - 16, yview - 16);
			this.fights[i].fighter2.draw(ctx, xview + 16, yview + 16);
		}
	};

	FightManager.prototype.process = function(dt) {

	};

	FightManager.prototype.addFight = function(fighter1, fighter2) {
		this.fights.push({fighter1: fighter1, fighter2: fighter2});
	}

	FIghtManager.prototype.removeFight = function(id) {
		for (var i in this.fights) {
			if (this.fights[i].fighter1.id === id || this.fights[i].fighter2.id === id) {
				this.fights.splice(i, 1);
			}
		}
	}
	
	Game.FightManager = new FightManager();
})();