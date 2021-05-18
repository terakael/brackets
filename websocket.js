(function() {
    function myWebSocket(addr, callback) {
        this.ws = new WebSocket(addr);
        this.ws.onopen = function() {
            console.log("connected");
        };
        
        this.ws.onmessage = function(evt) {
            var json = JSON.parse(evt.data);
            // console.log(JSON.stringify(json));
            callback(JSON.parse(evt.data));
        };
        
        this.ws.onclose = function() {
            console.log("onclose");
        };
        
        this.ws.onerror = function(evt) {
            console.log("onerror");
        };
        
        this.send = function(obj) {
            this.ws.send(JSON.stringify(obj));
        };
        
        
    };
    
    Game.WebSocket = myWebSocket;
})();