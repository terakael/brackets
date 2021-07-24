class ShowStatWindowResponse {    
    constructor() {
        this.action = "show_stat_window";
    }

    process(obj) {

        const {statId, rows} = obj;

        switch (statId) {
            case 9: { // herblore
                Game.activeUiWindow = new Game.PotionWindow(Game.worldCameraRect, rows, "potions");
                break;
            }

            case 13: { // artisan
                Game.activeUiWindow = new ArtisanWindow(Game.worldCameraRect, obj.artisanData);
                break;
            }

            default:
                break;
        }
    }
}

ResponseController.register(new ShowStatWindowResponse());