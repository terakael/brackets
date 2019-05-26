(function() {
	function SpriteManager() {

	};

	SpriteManager.prototype = {
		constructor: SpriteManager,
		spriteMaps: [],
		spriteFrames: [],
		items: [],
		loadSpriteMaps: function(spriteMaps) {
			for (var i in spriteMaps) {
				this.setSpriteMap(spriteMaps[i].id, spriteMaps[i].name, spriteMaps[i].dataBase64);
			}
		},
		loadSpriteFrames: function(frames) {
			for (var i in frames) {
				//{"id":1,"sprite_map_id":1,"x":0,"y":140,"w":32,"h":32,"margin":0,"frame_count":1,"animation_type_id":1}
				this.spriteFrames.push(new Game.SpriteFrame(frames[i]));
			}			
		},
		loadItems: function(items) {
			for (var i in items) {
				//items":[{"id":1,"name":"kanako","description":"it's kanako","spriteFrameId":1,"leftclickOption":0,"otherOptions":0}],
				this.items.push(new Game.Item({
					id: items[i].id,
					name: items[i].name,
					description: items[i].description,
					spriteFrame: this.getSpriteFrameById(items[i].spriteFrameId),
					leftclickOption: items[i].leftclickOption,
					otherOptions: items[i].otherOptions
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
		setSpriteMap: function(id, name, data) {
			var map = new Image();
			map.src = "data:image/png;base64,{0}".format(data);

			this.spriteMaps.push({
				id: id,
				name: name,
				map: map
			});
		},
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