class GroundItem {
	constructor(tileId, itemId) {
		this.tileId = tileId;
		this.item = SpriteManager.getItemById(itemId);

		this.pos = tileIdToXY(tileId);

		this.clickBox = new Rectangle(
			this.pos.x - ~~(this.item.spriteFrame.frames[0].width/2), 
			this.pos.y - ~~(this.item.spriteFrame.frames[0].height/2), 
			this.item.spriteFrame.frames[0].width, 
			this.item.spriteFrame.frames[0].height);
	}

	draw(ctx, xview, yview, sx, sy) {
		this.item.draw(ctx, (this.pos.x - xview) * (1/sx), (this.pos.y - yview) * (1/sy));
	}

	process(dt) {

	}
}