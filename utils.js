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

    wordWrap = function(str, maxWidth) {
        if (str.length <= maxWidth)
            return str;
            
        var newLineStr = "\n"; done = false; res = '';
        do {                    
            found = false;
            // Inserts new line at first whitespace of the line
            for (i = maxWidth - 1; i >= 0; i--) {
                if (this.testWhite(str.charAt(i))) {
                    res = res + [str.slice(0, i), newLineStr].join('');
                    str = str.slice(i + 1);
                    found = true;
                    break;
                }
            }
            // Inserts new line at maxWidth position, the word is too long to wrap
            if (!found) {
                res += [str.slice(0, maxWidth), newLineStr].join('');
                str = str.slice(maxWidth);
            }
    
            if (str.length < maxWidth)
                done = true;
        } while (!done);
    
        return res + str;
    }
    
    testWhite = function(x) {
        var white = new RegExp(/^\s$/);
        return white.test(x.charAt(0));
    };

    countToFriendly = function(count) {
        if (count < 100000)
            return String(count);
        else if (count >= 100000 && count < 10000000) {
            return ~~(count / 1000) + "k";
        } else {
            return ~~(count / 1000000) + 'M';
        }
    }
}());