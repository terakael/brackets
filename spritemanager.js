(function() {
	function SpriteManager() {

	};

	SpriteManager.prototype = {
		constructor: SpriteManager,
		spriteMaps: [],
		spriteFrames: [],
		items: [],
		loadSpriteMaps: function(spriteMaps) {
			let that = this;
			let postaction = function(){};
			for (let i in spriteMaps) {
				let map = new Image();
				map.src = "data:image/png;base64,{0}".format(spriteMaps[i].dataBase64);
				map.onload = function() {
					console.log("loaded " + spriteMaps[i].name);
					that.spriteMaps.push({
						id: spriteMaps[i].id,
						name: spriteMaps[i].name,
						map: map
					});

					if (that.spriteMaps.length === spriteMaps.length) {
						postaction();
					}
				}
			}

			return {
				done: function(f) {
					postaction = f || postaction;
				}
			}
		},
		loadSpriteFrames: function(frames) {
			for (var i in frames) {
				//{"id":1,"sprite_map_id":1,"x":0,"y":140,"w":32,"h":32,"anchorX":0.5,"anchory":0.95,"margin":0,"frame_count":1,"animation_type_id":1}
				this.spriteFrames.push(new Game.SpriteFrame(frames[i]));
			}			
		},
		loadItems: function(items) {
			for (var i in items) {
				//items":[{"id":1,"name":"kanako","spriteFrameId":1,"leftclickOption":0,"otherOptions":0,"attributes":1}],
				this.items.push(new Game.Item({
					id: items[i].id,
					name: items[i].name,
					spriteFrame: this.getSpriteFrameById(items[i].spriteFrameId),
					leftclickOption: items[i].leftclickOption,
					otherOptions: items[i].otherOptions,
					attributes: items[i].attributes
				}));
			}
		},
		getItemById: function(id) {
			for (var i in this.items) {
				if (this.items[i].id === id) {
					return this.items[i];
				}
			}
			return null;
		},
		// setSpriteMap: function(id, name, data) {
		// 	let that = this;
		// 	let map = new Image();
		// 	map.src = "data:image/png;base64,{0}".format(data);
		// 	map.onload = function() {
		// 		console.log("loaded " + name);
		// 		that.spriteMaps.push({
		// 			id: id,
		// 			name: name,
		// 			map: map
		// 		});
		// 	}
		// },
		getSpriteMapById: function(id) {
			for (var i in this.spriteMaps) {
				if (this.spriteMaps[i].id === id) {
					return this.spriteMaps[i].map;
				}
			}
			return null;
		},
		getSpriteMapByName: function(name) {
			for (var i in this.spriteMaps) {
				if (this.spriteMaps[i].name === name)
					return this.spriteMaps[i].map;
			}
			return null;
		},
		getSpriteFrameById: function(id) {
			for (var i in this.spriteFrames) {
				if (this.spriteFrames[i].id === id) {
					return this.spriteFrames[i];
				}
			}
			return null;
		}
	}
	
	Game.SpriteManager = new SpriteManager();
})();