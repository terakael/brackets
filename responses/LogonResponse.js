class LogonResponse {    
    constructor() {
        this.action = "logon";
    }

    process(obj) {
        document.title = obj.playerDto.name;

        const player = new Game.Player(obj.playerDto);
        player.loadStats(obj.stats, obj.boosts);
        player.setBonuses(obj.bonuses);
        player.loadAttackStyles(obj.attackStyles);
        player.setAttackStyle(obj.playerDto.attackStyleId);

        Game.cam.follow(player, (Game.context.canvas.width - 250 - (player.width / 2)) / 2, (Game.context.canvas.height) / 2);

        const playerXY = tileIdToXY(obj.playerDto.tileId);
        Game.cam.xView = playerXY.x - (Game.cam.xDeadZone * (1 / Game.scale));
        Game.cam.yView = playerXY.y - (Game.cam.yDeadZone * (1 / Game.scale));
        
        Game.Room.init(player);

        Game.ChatBox.add("Welcome to the game, {0}.".format(player.name));
        Game.state = 'game';
        Game.currentPlayer = player;
    }
}

ResponseController.register(new LogonResponse());