class ResponseController {
    static messageMap = new Map();
    
    static process(objArray) {
        objArray.forEach(obj => {
            const {action, responseText, colour} = obj;
            if (responseText.length > 0 && Game.state === "game") {
                Game.ChatBox.add(responseText, colour);
            }

            if (this.messageMap.has(action))
                this.messageMap.get(action).process(obj);
        });
    }

    static register(response) {
        this.messageMap.set(response.action, response);
    }
}