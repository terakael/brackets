(function() {
    function myWebSocket(addr, callback) {
        this.ws = new WebSocket(addr);
        this.ws.onopen = function() {
            console.log("connected");
        };
        
        this.ws.onmessage = function(evt) {
            var json = JSON.parse(evt.data);
            for (var i = 0; i < json.length; ++i) {
                for (var j in json[i]) {
                   for (var k in json[i][j]) {
                        if (json[i][j][k].dataBase64)
                            json[i][j][k].dataBase64 = "";
                    }
                }
            }
            console.log("onmessage: " + JSON.stringify(json));
            callback(JSON.parse(evt.data));
        };
        
        this.ws.onclose = function() {
            console.log("onclose");
        };
        
        this.ws.onerror = function(evt) {
            console.log("onerror");
        };
        
        this.send = function(obj) {
			//Game.ChatBox.add("sending: {0}".format(JSON.stringify(obj)));
            this.ws.send(JSON.stringify(obj));
        };
        
        
    };
    
    Game.WebSocket = myWebSocket;
})();