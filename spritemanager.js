(function() {
	function SpriteManager() {

	};

	SpriteManager.prototype = {
		constructor: SpriteManager,
		spriteMaps: [],
		spriteMapsWithColor: [],
		spriteFrames: [],
		items: [],
		groundTextures: [],
		loadSpriteMaps: function(spriteMaps) {
			let that = this;
			let postaction = function(){};
			let loadedImages = 0;

			for (let i in spriteMaps) {
				let map = new Image();
				map.src = "data:image/png;base64,{0}".format(spriteMaps[i].dataBase64);
				map.onload = function() {
					that.spriteMaps.push({
						id: spriteMaps[i].id,
						map: map
					});

					if (++loadedImages === spriteMaps.length) {
						postaction();
					}
				}
				map.onerror = function() {
					console.log("error loading spritemap id=" + spriteMaps[i].id);
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
					attributes: items[i].attributes,
					shiftclickOption: items[i].shiftclickOption
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
			return this.items.find(item => item.id === id);
		},
		getSpriteMapById: function(id) {
			const spriteMap = this.spriteMaps.find(e => e.id === id);
			return spriteMap ? spriteMap.map : null;
		},
		getSpriteMapByIdAndColor: function(id, color) {
			return this.spriteMapsWithColor.find(e => e.id === id && e.color === color);
		},
		getSpriteFrameById: function(id) {
			return this.spriteFrames.find(e => e.id === id);
		},
		getGroundTextureById: function(id) {
			return this.groundTextures.find(e => e.id === id);
		}
	}
	
	Game.SpriteManager = new SpriteManager();
})();