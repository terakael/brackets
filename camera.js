(function () {

    // possibles axis to move the camera
    var AXIS = {
        NONE: "none",
        HORIZONTAL: "horizontal",
        VERTICAL: "vertical",
        BOTH: "both"
    };

    // Camera constructor
    function Camera(xView, yView, canvasWidth, canvasHeight, worldWidth, worldHeight) {
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

        // rectangle that represents the viewport
        this.viewportRect = new window.Game.Rectangle(this.xView, this.yView, this.wView, this.hView);

        // rectangle that represents the world's boundary (room's boundary)
        this.worldRect = new window.Game.Rectangle(0, 0, worldWidth, worldHeight);
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
            if (this.axis === AXIS.HORIZONTAL || this.axis === AXIS.BOTH) {
                // moves camera on horizontal axis based on followed object position
                //if (this.followed.x - this.xView  + this.xDeadZone > this.wView)
                //    this.xView = this.followed.x - (this.wView - this.xDeadZone);
                //else if(this.followed.x  - this.xDeadZone < this.xView)
                    //this.xView = this.followed.x - this.xDeadZone;
                this.targetxView = this.followed.x - this.xDeadZone *(1/Game.scale);
            }
            if (this.axis === AXIS.VERTICAL || this.axis === AXIS.BOTH) {
                // moves camera on vertical axis based on followed object position
                //if (this.followed.y - this.yView + this.yDeadZone > this.hView)
                //    this.yView = this.followed.y - (this.hView - this.yDeadZone);
                //else if(this.followed.y - this.yDeadZone < this.yView)
                    //this.yView = this.followed.y - this.yDeadZone;
                this.targetyView = this.followed.y - this.yDeadZone*(1/Game.scale);
            }

            // if we teleport greater than a certain amount, snap the camera straight to position 
            // instead of dragging across the world (with a slight variance for smoothness)
            if (Math.abs(this.targetxView - this.xView) > 500)
                this.xView = this.targetxView + Math.getRandom(-20, 20);

            if (Math.abs(this.targetyView - this.yView) > 500)
                this.yView = this.targetyView + Math.getRandom(-20, 20);
            
            this.xView += (this.targetxView - this.xView) * (dt * 5);
            this.yView += (this.targetyView - this.yView) * (dt * 5);
        }

        var wView = this.wView * (1/Game.scale);
        var hView = this.hView * (1/Game.scale);
        // update viewportRect
        this.viewportRect.set(this.xView, this.yView, wView, hView);

        // don't let camera leaves the world's boundary
        // if (!Game.isometric) {
        //     if (!this.viewportRect.within(this.worldRect)) {
        //         if(this.viewportRect.left < this.worldRect.left)
        //             this.xView = this.worldRect.left;
        //         if(this.viewportRect.top < this.worldRect.top)					
        //             this.yView = this.worldRect.top;
        //         if(this.viewportRect.right > this.worldRect.right)
        //             this.xView = this.worldRect.right - wView;
        //         if(this.viewportRect.bottom > this.worldRect.bottom)					
        //             this.yView = this.worldRect.bottom - hView;
        //     }
        // }
    };

    // add "class" Camera to our Game object
    window.Game.Camera = Camera;

}());