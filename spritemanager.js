class SpriteManager {
	static spriteMaps = [];
	static spriteMapsWithColor = [];
	static spriteFrames = [];
	static items = [];
	static groundTextures = [];

	static loadSpriteMaps(s) {
		let postaction = function(){};
		let loadedImages = 0;

		for (let i in s) {
			let map = new Image();
			map.src = "data:image/png;base64,{0}".format(s[i].dataBase64);
			map.onload = function() {
				SpriteManager.spriteMaps.push({
					id: s[i].id,
					map: map
				});

				if (++loadedImages === s.length) {
					postaction();
				}
			}
			map.onerror = function() {
				console.log("error loading spritemap id=" + s[i].id);
			}
		}

		return {
			done: function(f) {
				postaction = f || postaction;
			}
		}
	}

	static loadSpriteFrames(frames) {
		for (var i in frames) {
			//{"id":1,"sprite_map_id":1,"x":0,"y":140,"w":32,"h":32,"anchorX":0.5,"anchory":0.95,"margin":0,"frame_count":1,"animation_type_id":1}
			SpriteManager.spriteFrames.push(new SpriteFrame(frames[i]));
		}			
	}

	static loadItems(itemList) {
		for (var i in itemList) {
			//items":[{"id":1,"name":"kanako","spriteFrameId":1,"leftclickOption":0,"otherOptions":0,"attributes":1}],
			SpriteManager.items.push(new Item({
				id: itemList[i].id,
				name: itemList[i].name,
				spriteFrame: SpriteManager.getSpriteFrameById(itemList[i].spriteFrameId),
				leftclickOption: itemList[i].leftclickOption,
				otherOptions: itemList[i].otherOptions,
				attributes: itemList[i].attributes,
				shiftclickOption: itemList[i].shiftclickOption
			}));
		}
	}

	static loadGroundTextures(textures) {
		for (let i = 0; i < textures.length; ++i) {
			SpriteManager.groundTextures.push(new SpriteFrame({
				id: textures[i].id,
				sprite_map_id: textures[i].spriteMapId,
				x: textures[i].x,
				y: textures[i].y,
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
	}

	static getItemById(id) {
		return SpriteManager.items.find(item => item.id === id);
	}

	static getSpriteMapById(id, color) {
		if (color)
			return this.getSpriteMapByIdAndColor(id, color);

		const spriteMap = SpriteManager.spriteMaps.find(e => e.id === id);
		return spriteMap ? spriteMap.map : null;
	}

	static getSpriteMapByIdAndColor(id, color) {
		let spriteMapObj = SpriteManager.spriteMapsWithColor.find(e => e.id === id && e.color === color);

		if (spriteMapObj && spriteMapObj.ready) {
			return spriteMapObj.map;
		} else if (!spriteMapObj) {
			const spriteMap = SpriteManager.getSpriteMapById(id);
			if (!spriteMap) return null;

			const c = Game.otherContext;
			c.canvas.width = spriteMap.width;
			c.canvas.height = spriteMap.height;
			c.clearRect(0, 0, c.canvas.width, c.canvas.height);
			
			c.globalCompositeOperation = "source-over";
			c.drawImage(spriteMap, 0, 0, spriteMap.width, spriteMap.height);

			const hsl = decToHsl(color);

			// adjust "lightness"
			c.globalCompositeOperation =  "color-dodge";
			// for common slider, to produce a valid value for both directions
			const l = hsl.l >= 100 ? hsl.l - 100 : 100 - (100 - hsl.l);
			c.fillStyle = "hsl(0, 50%, " + hsl.l + "%)";
			c.fillRect(0, 0, spriteMap.width, spriteMap.height);
			
			// adjust saturation
			c.globalCompositeOperation = "saturation";
			c.fillStyle = "hsl(0," + hsl.s + "%, 50%)";
			c.fillRect(0, 0, spriteMap.width, spriteMap.height);
		
			// adjust hue
			c.globalCompositeOperation = "hue";
			c.fillStyle = "hsl(" + hsl.h + ",1%, 50%)";
			c.fillRect(0, 0, spriteMap.width, spriteMap.height);

			c.globalCompositeOperation = "destination-in";
			c.drawImage(spriteMap, 0, 0, spriteMap.width, spriteMap.height);

			const map = new Image();
			map.src = c.canvas.toDataURL();
			const spriteMapWithColor = {
				id,
				name: "",
				map,
				color,
				ready: false
			};
			SpriteManager.spriteMapsWithColor.push(spriteMapWithColor);
			map.onload = function() {
				spriteMapWithColor.ready = true;
			}
		}
		return null;
	}

	static getSpriteFrameById(id) {
		return SpriteManager.spriteFrames.find(e => e.id === id);
	}

	static getGroundTextureById(id) {
		return SpriteManager.groundTextures.find(e => e.id === id);
	}
}