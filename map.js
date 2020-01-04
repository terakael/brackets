(function(){
    function Map(width, height, sw, sh){
        // map dimensions
        this.width = width;
        this.height = height;
        this.swidth = sw;
        this.sheight = sh;

        // map texture
        this.image = null;
    }

    Map.prototype.load = function(context, imageData) {
        var pattern = context.createPattern(imageData, "repeat");
        var ctx = document.createElement("canvas").getContext("2d");
        ctx.canvas.width = this.width;
        ctx.canvas.height = this.height;
        ctx.save();
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        this.image = imageData;
        this.image.src = ctx.canvas.toDataURL("image/png");// this is slow af, takes over a second
        ctx = null;
    }

    // draw the map adjusted to camera
    Map.prototype.draw = function(context, xView, yView){	
        // easiest way: draw the entire map changing only the destination coordinate in canvas
        // canvas will cull the image by itself (no performance gaps -> in hardware accelerated environments, at least)
        //if (this.imageReady) {
            //context.drawImage(this.image, 0, 0, this.image.width, this.image.height, -xView, -yView, this.image.width, this.image.height);
            // context.drawImage(this.image, 
            //                   (xView/this.width) * this.image.width, 
            //                   (yView/this.height) * this.image.height, 
            //                   (this.swidth/this.width) * this.image.width, 
            //                   (this.sheight/this.height) * this.image.height, 
            //                   0, 
            //                   0, 
            //                   this.swidth, 
            //                   this.sheight);
            
            
            

            //  context.drawImage(this.image, xView, yView, this.swidth, this.sheight, 0, 0, this.swidth, this.sheight);
            
            
            
            //context.drawImage(this.image, 0, 0, this.image.width, this.image.height, 0, 0, this.image.width, this.image.height);
        //}

        // didactic way:

/*        var sx, sy, dx, dy;
        var sWidth, sHeight, dWidth, dHeight;

        // offset point to crop the image
        sx = xView;
        sy = yView;

        // dimensions of cropped image			
        sWidth =  this.swidth || context.canvas.width;
        sHeight = this.sheight || context.canvas.height;

        // if cropped image is smaller than canvas we need to change the source dimensions
        if(this.image.width - sx < sWidth){
            sWidth = this.image.width - sx;
        }
        if(this.image.height - sy < sHeight){
            sHeight = this.image.height - sy; 
        }

        // location on canvas to draw the croped image
        dx = 0;
        dy = 0;
        // match destination with source to not scale the image
        dWidth = sWidth;
        dHeight = sHeight;									

        context.fillStyle = this.image.activePattern || "red";
        context.drawImage(this.image, Math.floor(sx), Math.floor(sy), sWidth, sHeight, dx, dy, dWidth, dHeight);	*/
    }

    // add "class" Map to our Game object
    Game.Map = Map;

})();