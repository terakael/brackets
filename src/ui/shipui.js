class ShipUi {
    constructor() {
        this.clear();
    }

    clear() {
        this.depth = null;
        this.fish = null;
        this.accessorySpriteIds = null
        this.passengers = [];
    }

    updateUi(obj) {
        if (obj.hasOwnProperty("fishPopulation")) {
            this.fish = obj.fishPopulation;
        }

        if (obj.hasOwnProperty("depth")) {
            this.depth = obj.depth;
        }

        if (obj.hasOwnProperty("accessorySpriteIds"))
            this.accessorySpriteIds = obj.accessorySpriteIds;

        if (obj.hasOwnProperty("boardedPlayers"))
            this.passengers.push(...obj.boardedPlayers);

        if (obj.hasOwnProperty("disembarkedPlayers"))
            this.passengers = this.passengers.filter(passenger => !obj.disembarkedPlayers.includes(passenger));
    }

    draw(ctx) {
        if (!Game.currentPlayer.onboardShipId)
            return;

        ctx.save();
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
		ctx.font = "15px customFont";

        if (this.depth != null)
            ctx.fillText(`depth: ${this.depth}`, 10, 80);

        if (this.fish != null)
            ctx.fillText(`fish: ${this.fish}`, 10, 100);

        if (this.accessorySpriteIds != null) {
            ctx.fillText("accessories: ", 10, 120);
            for (let i = 0; i < this.accessorySpriteIds.length; ++i) {
                SpriteManager.getSpriteFrameById(this.accessorySpriteIds[i]).draw(ctx, 120 + (i * 32), 120);
            }
        }

        if (this.passengers != null) {
            ctx.fillText(`passengers: ${this.passengers.join(', ')}`, 10, 140);
        }

        ctx.restore();
    }
}