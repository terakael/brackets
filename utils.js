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
}());