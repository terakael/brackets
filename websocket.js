(function() {
    function myWebSocket(addr, callback) {
        this.ws = new WebSocket(addr);
        this.ws.onopen = function() {
            console.log("connected");
            Game.ChatBox.add("connected");
        };
        
        this.ws.onmessage = function(evt) {
            console.log("onmessage: " + JSON.stringify(JSON.parse(evt.data)));
            callback(JSON.parse(evt.data));
        };
        
        this.ws.onclose = function() {
            console.log("onclose");
            Game.ChatBox.add("onclose");
        };
        
        this.ws.onerror = function(evt) {
            console.log("onerror");
            Game.ChatBox.add("onerror: {0}".format(evt.data));
        };
        
        this.send = function(obj) {
            this.ws.send(JSON.stringify(obj));
        };
        
        
    };
    
    Game.WebSocket = myWebSocket;
})();