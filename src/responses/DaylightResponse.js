class DaylightResponse {    
    constructor() {
        this.action = "daylight";
    }

    process(obj) {
        const {brightness, transitionInstantly} = obj;

        Game.targetBrightness = brightness;
        if (transitionInstantly)
            Game.brightness = brightness;
    }
}

ResponseController.register(new DaylightResponse());