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

    // generate an example of a large map
    Map.prototype.generate = function(img){
        var ctx = document.createElement("canvas").getContext("2d");		
        ctx.canvas.width = this.width;
        ctx.canvas.height = this.height;		

        var rows = ~~(this.width/32) + 1;
        var columns = ~~(this.height/32) + 1;
        //var color = "red";				
        ctx.save();			
        for (var x = 0, i = 0; i < rows; x+=32, i++) {	
            for (var y = 0, j=0; j < columns; y+=32, j++) {
				ctx.fillStyle = "rgb({0}, {1}, {2})".format(Math.getRandomI(0, 100), Math.getRandomI(100, 255), Math.getRandomI(0, 100));
                ctx.fillRect (x, y, 30, 30);
            }		
        }		
        ctx.restore();	

        // store the generate map as this image texture
        this.image = new Image();
        this.image.src = ctx.canvas.toDataURL("image/png");

        // clear context
        ctx = null;
    }

    // draw the map adjusted to camera
    Map.prototype.draw = function(context, xView, yView){					
        // easiest way: draw the entire map changing only the destination coordinate in canvas
        // canvas will cull the image by itself (no performance gaps -> in hardware accelerated environments, at least)
        context.drawImage(this.image, 0, 0, this.image.width, this.image.height, -xView, -yView, this.image.width, this.image.height);

        // didactic way:
/*
        var sx, sy, dx, dy;
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