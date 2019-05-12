(function() {
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function(match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        }
    }
	
	// math doesn't have a prototype cos it' a static object?
	Math.getRandom = function(min, max) {
		return Math.random() * (max - min) + min;
	}

	Math.getRandomI = function(min, max) {
		return ~~Math.getRandom(min, max);
	}
    
    Math.getVectorMagnitude = function(v) {
        return Math.sqrt((v.x * v.x) + (v.y * v.y));
    }
    
    Math.getVectorNormal = function(v) {
        var mag = Math.getVectorMagnitude(v);
        return {x: v.x / mag, y: v.y / mag};
    }
    
    Math.radToDeg = function(rad) {
        return rad * 180/Math.PI;
    }
    
    Math.degToRad = function(deg) {
        return Math.PI/180 * deg;
    }

    tileIdToXY = function(tileId) {
        return {
            x: ((tileId % 250) * 32) + 16,
            y: (Math.trunc(tileId / 250) * 32) + 16
        }
    }

    xyToTileId = function(x,y) {
        var destX = Math.trunc(x / 32);
		var destY = Math.trunc(y / 32);
			
        return destX + (destY * 250);
    }
}());