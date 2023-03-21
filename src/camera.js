(function () {

    // possibles axis to move the camera
    var AXIS = {
        NONE: "none",
        HORIZONTAL: "horizontal",
        VERTICAL: "vertical",
        BOTH: "both"
    };

    // Camera constructor
    function Camera(xView, yView, canvasWidth, canvasHeight) {
        // position of camera in the world (left-top coordinate)
        this.xView = xView || 0;
        this.yView = yView || 0;
        
        this.targetxView = this.xView;
        this.targetyView = this.yView;

        // distance from followed object to border before camera starts move
        this.xDeadZone = 0; // min distance to horizontal borders
        this.yDeadZone = 0; // min distance to vertical borders

        // viewport dimensions
        this.wView = canvasWidth;
        this.hView = canvasHeight;

        // allow camera to move in vertical and horizontal axis
        this.axis = AXIS.BOTH;

        // object that should be followed
        this.followed = null;
        this.rubberBandPos = null;

        // rectangle that represents the viewport
        this.viewportRect = new Rectangle(this.xView, this.yView, this.wView, this.hView);
    }

    // gameObject needs to have "x" and "y" properties (as world(or room) position)
    Camera.prototype.follow = function (gameObject, xDeadZone, yDeadZone) {
        this.followed = gameObject;
        this.xDeadZone = xDeadZone;
        this.yDeadZone = yDeadZone;
    };

    Camera.prototype.update = function (dt) {
        // keep following the player (or other desired object)
        if (this.followed != null) {
            if (this.rubberBandPos == null) {
                this.rubberBandPos = {x: this.followed.x, y: this.followed.y - 16}
            } else {
                this.rubberBandPos.x += (this.followed.x - this.rubberBandPos.x) * (dt * 5);
                this.rubberBandPos.y += (this.followed.y - this.rubberBandPos.y - 16) * (dt * 5);
            }
            
            if (this.axis === AXIS.HORIZONTAL || this.axis === AXIS.BOTH) {
                // moves camera on horizontal axis based on followed object position
                this.targetxView = this.rubberBandPos.x - this.xDeadZone + (this.xDeadZone - (this.xDeadZone * (1/Game.scale)))
            }
            if (this.axis === AXIS.VERTICAL || this.axis === AXIS.BOTH) {
                // moves camera on vertical axis based on followed object position
                this.targetyView = this.rubberBandPos.y - this.yDeadZone + (this.yDeadZone - (this.yDeadZone * (1/Game.scale)))
            }

            // if we teleport greater than a certain amount, snap the camera straight to position 
            // instead of dragging across the world (with a slight variance for smoothness)
            if (Math.abs(this.targetxView - this.followed.x) > 500) {
                this.targetxView = this.followed.x;
                this.rubberBandPos.x = this.followed.x;
            }

            if (Math.abs(this.targetyView - this.yView) > 500) {
                this.targetyView = this.followed.y;
                this.rubberBandPos.y = this.followed.y;
            }
            
            this.xView = this.targetxView;
            this.yView = this.targetyView;
        }

        // var wView = this.wView;
        // var hView = this.hView;
        // update viewportRect
        this.viewportRect.set(this.xView, this.yView, this.wView, this.hView);
    };

    Camera.prototype.updateCanvasSize = function(x, y, w, h) {
        this.xView = x || 0;
        this.yView = y || 0;
        this.wView = w;
        this.hView = h;
        this.viewportRect.set(this.xView, this.yView, this.wView, this.hView);
    }

    // add "class" Camera to our Game object
    window.Game.Camera = Camera;

}());