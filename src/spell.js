(function() {
    function Spell(sourceTileId, target, type, lifetime, speed) {
        this.target = target;
        this.spriteFrame = SpriteManager.getSpriteFrameById(type);
        this.sourcePos = tileIdToXY(sourceTileId);//{x: source.x, y: source.y};
        this.pos = tileIdToXY(sourceTileId);//{x: source.x, y: source.y};
        this.lifetime = lifetime;
        this.destPos = {x: target.x || target.pos.x, y: target.y || target.pos.y};
        this.timeToReachTarget = 0;
        this.speed = speed;
    }

    Spell.prototype.setLocalPosition = function(x, y) {
        this.rect.set(~~(this.rect.left + x) + 0.5, ~~(this.rect.top + y) + 0.5);
    }
    
    Spell.prototype.draw = function(context, xview, yview) {
        // drawn in the room draw function
    }

    Spell.prototype.process = function(dt) {
        this.spriteFrame.process(dt);

        this.destPos = {x: this.target.x || this.target.pos.x, y: this.target.y || this.target.pos.y};

        this.timeToReachTarget = Math.min(0.5, this.timeToReachTarget + (dt * this.speed));

        this.pos.x = this.sourcePos.x + (this.destPos.x - this.sourcePos.x) * (this.timeToReachTarget * 2);
        this.pos.y = this.sourcePos.y + (this.destPos.y - this.sourcePos.y) * (this.timeToReachTarget * 2);
        
        this.lifetime -= dt;
    }

    Game.Spell = Spell;
}());