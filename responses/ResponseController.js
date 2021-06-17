class ResponseController {
    static messageMap = new Map();
    
    static process(obj) {
        if (this.messageMap.has(obj.action))
            this.messageMap.get(obj.action).process(obj);
    }

    static register(response) {
        this.messageMap.set(response.action, response);
    }
}