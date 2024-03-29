class ResponseController {
    static messageMap = new Map();
    
    static process(objArray) {
        objArray.forEach(obj => {
            const {action, success, responseText, colour} = obj;
            // console.log(obj)

            if (success && this.messageMap.has(action))
                this.messageMap.get(action).process(obj);

            if (responseText.length && Game.state === "game") {
                ChatBox.add(responseText, colour || "white");
            }
        });
    }

    static register(response) {
        this.messageMap.set(response.action, response);
    }
}