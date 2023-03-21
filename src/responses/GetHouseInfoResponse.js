class GetHouseInfoResponse {    
    constructor() {
        this.action = "get_house_info";
    }

    process(obj) {
        Game.activeUiWindow = new HouseInfoWindow(Game.worldCameraRect, obj);
    }
}

ResponseController.register(new GetHouseInfoResponse());