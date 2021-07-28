class LogonResponse {    
    constructor() {
        this.action = "logon";
    }

    process(obj) {
        document.title = obj.playerDto.name;
        const canvas = document.getElementById("game")

        console.log(obj);
        const player = new Game.Player(obj.playerDto);
        player.loadAttackStyles(obj.attackStyles);
        player.setAttackStyle(obj.playerDto.attackStyleId);

        Game.cam = new Game.Camera(player.x, player.y, canvas.width - 250, canvas.height);
        Game.hudcam = new Game.Camera(Game.cam.viewportRect.width, 0, canvas.width - Game.cam.viewportRect.width, canvas.height);

        Game.cam.follow(player, (canvas.width - 250 - (player.width / 2)) / 2, (canvas.height) / 2);

        Game.worldCameraRect = new Rectangle(0, 0, canvas.width - 250, canvas.height);

        Game.hudCameraRect = new Rectangle(Game.cam.viewportRect.width, 0, canvas.width - Game.cam.viewportRect.width, canvas.height);
        Game.HUD = new Game.HeadsUpDisplay(Game.hudCameraRect);

        player.stats = new Game.Stats(new Rectangle(Game.hudCameraRect.left, 450, Game.hudCameraRect.width, 150));
        player.inventory = new Inventory(Game.hudCameraRect);
        player.loadStats(obj.stats, obj.boosts);
        player.setBonuses(obj.bonuses);

        Game.Minimap.setRect(Game.hudcam.viewportRect.left + 10, Game.hudcam.viewportRect.top + 10, 230, 230);
        Game.cursor = new Game.Cursor((Game.hudcam.xView + Game.hudcam.wView) - 10, Game.hudcam.yView + 20)

        const playerXY = tileIdToXY(obj.playerDto.tileId);
        Game.cam.xView = playerXY.x - (Game.cam.xDeadZone * (1 / Game.scale));
        Game.cam.yView = playerXY.y - (Game.cam.yDeadZone * (1 / Game.scale));
        
        Game.Room.init(player);

        ChatBox.add("Welcome to the game, {0}.".format(player.name));
        Game.state = 'game';
        Game.currentPlayer = player;
    }
}

ResponseController.register(new LogonResponse());