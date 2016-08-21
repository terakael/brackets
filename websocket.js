(function() {
    function myWebSocket(addr) {
        this.ws = new WebSocket(addr);
        this.ws.onopen = function() {
            console.log("connected");
            Game.ChatBox.add("connected");
        };
        
        this.ws.onmessage = function(evt) {
            console.log("onmessage: " + evt.data);
            Game.ChatBox.add("onmessage: " + evt.data);
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