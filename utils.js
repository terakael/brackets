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
}());