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
            x: ((tileId % 25000) * 32) + 16,
            y: (Math.trunc(tileId / 25000) * 32) + 16
        }
    }

    xyToTileId = function(x,y) {
        var destX = Math.trunc(x / 32);
		var destY = Math.trunc(y / 32);
			
        return destX + (destY * 25000);
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

    decToHexColor = function(dec) {
        if (!dec)
            return null;

        let hex = dec.toString(16);
        return "#" + hex.padStart(6, 0);
    }

    decToHsl = function(dec) {
        let rgb = hexToRgb(("000000" + dec.toString(16)).slice(-6));
        return rgbToHsl(rgb.r, rgb.g, rgb.b);
    }

    hexToRgb = function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      }

    rgbToHsl = function(r, g, b) {
        r /= 255, g /= 255, b /= 255;
      
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
      
        if (max == min) {
          h = s = 0; // achromatic
        } else {
          var d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
      
          h /= 6;
        }
      
        return {h: h * 360, s: s * 100, l: l * 100};
      }
}());