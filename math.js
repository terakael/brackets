(function () {
    function Rectangle(left, top, width, height) {
        this.left = left || 0;
        this.top = top || 0;
        this.width = width || 0;
        this.height = height || 0;
        this.right = this.left + this.width;
        this.bottom = this.top + this.height;
    }

    Rectangle.prototype.set = function (left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width || this.width;
        this.height = height || this.height;
        this.right = (this.left + this.width);
        this.bottom = (this.top + this.height);
    };

    Rectangle.prototype.setPos = function(x, y) {
        this.left = x;
        this.top = y;
        this.right = this.left + this.width;
        this.bottom = this.top + this.height;
    };

    Rectangle.prototype.pointWithin = function(p) {
        return p.x >= this.left && p.x <= this.right && p.y >= this.top && p.y <= this.bottom;
    };

    Rectangle.prototype.within = function (r) {
        return (r.left <= this.left && r.right >= this.right && r.top <= this.top && r.bottom >= this.bottom);
    };

    Rectangle.prototype.overlaps = function (r) {
        return (this.left < r.right && r.left < this.right && this.top < r.bottom && r.top < this.bottom);
    };
    
    Rectangle.prototype.dump = function () {
        return this.left + ", " + this.top + ", " + this.width + ", " + this.height;
    };
    
    // add "class" Rectangle to our Game object
    window.Game.Rectangle = Rectangle;
    
    function Transform() {
        this.reset();
    };
    Transform.prototype = {
        constructor: Transform,
        reset: function() {
            this.m = [1,0,0,1,0,0];
        },
        multiply: function(matrix) {
            var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
            var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

            var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
            var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

            var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
            var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

            this.m[0] = m11;
            this.m[1] = m12;
            this.m[2] = m21;
            this.m[3] = m22;
            this.m[4] = dx;
            this.m[5] = dy;
        },
        invert: function() {
            var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
            var m0 = this.m[3] * d;
            var m1 = -this.m[1] * d;
            var m2 = -this.m[2] * d;
            var m3 = this.m[0] * d;
            var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
            var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
            this.m[0] = m0;
            this.m[1] = m1;
            this.m[2] = m2;
            this.m[3] = m3;
            this.m[4] = m4;
            this.m[5] = m5;
        },
        rotate: function(rad) {
            var c = Math.cos(rad);
            var s = Math.sin(rad);
            var m11 = this.m[0] * c + this.m[2] * s;
            var m12 = this.m[1] * c + this.m[3] * s;
            var m21 = this.m[0] * -s + this.m[2] * c;
            var m22 = this.m[1] * -s + this.m[3] * c;
            this.m[0] = m11;
            this.m[1] = m12;
            this.m[2] = m21;
            this.m[3] = m22;
        },
        translate: function(x, y) {
            this.m[4] += this.m[0] * x + this.m[2] * y;
            this.m[5] += this.m[1] * x + this.m[3] * y;
        },
        scale: function(sx, sy) {
            this.m[0] *= sx;
            this.m[1] *= sx;
            this.m[2] *= sy;
            this.m[3] *= sy;
        },
        transformPoint: function(px, py) {
            var cross = this.m[0] * this.m[3] - this.m[1] * this.m[2];
            var inv = [
                this.m[3]/cross,
                -this.m[1]/cross,
                -this.m[2]/cross,
                this.m[0]/cross
            ];
            
            var x = px - this.m[4];
            var y = py - this.m[5];
            
            return {
                x: x * inv[0] + y * inv[2],
                y: x * inv[1] + y * inv[3]
            };
        }
    };
    window.Game.Transform = Transform;
}());