(function() {
	function SpriteManager() {

	};

	SpriteManager.prototype = {
		constructor: SpriteManager,
		spriteMaps: [],
		spriteFrames: [],
		items: [],
		groundTextures: [],
		loadSpriteMaps: function(spriteMaps) {
			let that = this;
			let postaction = function(){};
			for (let i in spriteMaps) {
				let map = new Image();
				map.src = "data:image/png;base64,{0}".format(spriteMaps[i].dataBase64);
				map.onload = function() {
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
		loadGroundTextures: function(groundTextures) {
			for (let i = 0; i < groundTextures.length; ++i) {
				this.groundTextures.push(new Game.SpriteFrame({
					id: groundTextures[i].id,
					sprite_map_id: groundTextures[i].spriteMapId,
					x: groundTextures[i].x,
					y: groundTextures[i].y,
					w: 32,
					h: 32,
					margin: 0,

					// TODO in the future we could have animated ground textures e.g. water/lava
					frame_count: 1,
					framerate: 0,
					animation_type_id: 1,
					anchorX: 0.5,
					anchorY: 0.5
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
		},
		getGroundTextureById: function(id) {
			for (let i in this.groundTextures) {
				if (this.groundTextures[i].id === id)
					return this.groundTextures[i];
			}
			return null;
		}
	}
	
	Game.SpriteManager = new SpriteManager();
})();