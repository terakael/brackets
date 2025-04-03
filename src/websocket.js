class GameWebSocket {
    constructor(addr, callback) {
        this.ws = new WebSocket(`wss://danscape.bearded-quail.ts.net/${addr}`);
        // this.ws = new WebSocket(`ws://${ip}:${port}/ws/${addr}`);
        this.ws.onmessage = evt => callback(JSON.parse(evt.data));
        this.send = obj => this.ws.send(JSON.stringify(obj));
    };
}