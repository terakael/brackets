(function() {
    function Room() {
        this.player = {};
        this.show = 0;
        this.currentShow = 0;
        this.otherPlayers = [];
        this.npcs = [];
        this.ships = [];
        this.constructableInstancesById = new Map();
        this.sceneryInstances = new Map();
        this.sceneryInstancesBySceneryId = new Map();
        this.groundTextureInstances = new Map();
        this.drawableTextureInstances = [];
        this.optimizedDrawableTextureInstance = new Map();
        this.groundTexturesMap = new Map();
        this.drawableSceneryMap = new Map();
        this.spells = [];
        this.teleportExplosions = []; // [{x, y, lifetime}]
        this.groundItems = [];
        this.t = new Transform();
    }
    
    Room.prototype.loadMinimap = function(minimapBase64, segmentId) {
        let image = new Image();
        image.src = `data:image/png;base64,${minimapBase64}`;
        image.onload = () => Game.Minimap.load(image, segmentId);
    };

    Room.prototype.init = function (player) {
        this.player = player;

        this.show = 1.0;
        let groundTextureCanvas = document.createElement("canvas");
        groundTextureCanvas.width = 32 * 25; // 25 tiles across, 32 pixels each
        groundTextureCanvas.height = 32 * 25; // 25 tiles across, 32 pixels each
        this.groundTextureCtx = groundTextureCanvas.getContext("2d");

        let sceneryCanvas = document.createElement("canvas");
        sceneryCanvas.width = groundTextureCanvas.width;
        sceneryCanvas.height = groundTextureCanvas.height;
        this.sceneryCtx = sceneryCanvas.getContext("2d");
    };

    Room.prototype.getPlayerById = function(id) {
        if (this.player.id === id)
            return this.player;
        return this.otherPlayers.find(p => p.id === id);
    };

    Room.prototype.playerById = function(id, fn) {
        const player = this.getPlayerById(id);
        if (player) {
            fn.call(this, player);
        }
    };

    Room.prototype.getNpcById = function(id) {
        return this.npcs.find(npc => npc.instanceId === id);
    };

    Room.prototype.npcById = function(id, fn) {
        const npc = this.getNpcById(id);
        if (npc) {
            fn.call(this, npc);
        }
    };

    Room.prototype.getShipById = function(id) {
        return this.ships.find(ship => ship.instanceId === id);
    };
    
    Room.prototype.shipById = function(id, fn) {
        const ship = this.getShipById(id);
        if (ship) {
            fn.call(this, ship);
        }
    };

    Room.prototype.loadSceneryInstances = function(depletedScenery, openDoors) {   
        this.sceneryInstances = new Map();

        let fn = (sceneryId, tileIdList) => {
            const scenery = Game.sceneryMap.get(Number(sceneryId));
            for (let i = 0; i < tileIdList.length; ++i) {
                sceneryLabel = null; // for the doors basically, we want to override the "open" if the door is already open
                let newSprite = new SpriteFrame(SpriteManager.getSpriteFrameById(scenery.spriteFrameId).frameData);
                if (depletedScenery.includes(tileIdList[i]) || openDoors.includes(tileIdList[i])) {
                    newSprite.nextFrame(); // depleted scenery and open doors use frame[1] instead of frame[0], which sometimes contains different bounding boxes
                }

                if (openDoors.includes(tileIdList[i])) {
                    sceneryLabel = "close " + scenery.name;
                }

                const xy = tileIdToXY(tileIdList[i]);
                const mapKey = xy.y + newSprite.getBoundingBox().bottom;

                if (!this.sceneryInstances.has(mapKey))
                    this.sceneryInstances.set(mapKey, []);

                this.sceneryInstances.get(mapKey).push({
                    id: scenery.id,
                    name: scenery.name,
                    x: xy.x, 
                    y: xy.y,
                    tileId: tileIdList[i], 
                    leftclickOption: scenery.leftclickOption,
                    label: sceneryLabel,
                    sprite: [newSprite],
                    type: "scenery",
                    attributes: scenery.attributes
                });
            }
        }

        for (const [sceneryId, tileIdList] of this.sceneryInstancesBySceneryId.entries()) {
            fn(sceneryId, tileIdList);
        }

        for (const [sceneryId, tileIdList] of this.constructableInstancesById.entries()) {
            fn(sceneryId, tileIdList);
        }

        
        
        // for (const [sceneryId, tileIdList] of this.sceneryInstancesBySceneryId.entries()) {
        //     const scenery = Game.sceneryMap.get(Number(sceneryId));
        //     for (let i = 0; i < tileIdList.length; ++i) {
        //         sceneryLabel = null; // for the doors basically, we want to override the "open" if the door is already open
        //         let newSprite = new SpriteFrame(SpriteManager.getSpriteFrameById(scenery.spriteFrameId).frameData);
        //         if (depletedScenery.includes(tileIdList[i]) || openDoors.includes(tileIdList[i])) {
        //             newSprite.nextFrame(); // depleted scenery and open doors use frame[1] instead of frame[0], which sometimes contains different bounding boxes
        //         }

        //         if (openDoors.includes(tileIdList[i])) {
        //             sceneryLabel = "close " + scenery.name;
        //         }

        //         const xy = tileIdToXY(tileIdList[i]);
        //         const mapKey = xy.y + newSprite.getBoundingBox().bottom;

        //         if (!this.sceneryInstances.has(mapKey))
        //             this.sceneryInstances.set(mapKey, []);

        //         this.sceneryInstances.get(mapKey).push({
        //             id: scenery.id,
        //             name: scenery.name,
        //             x: xy.x, 
        //             y: xy.y,
        //             tileId: tileIdList[i], 
        //             leftclickOption: scenery.leftclickOption,
        //             label: sceneryLabel,
        //             sprite: [newSprite],
        //             type: "scenery",
        //             attributes: scenery.attributes
        //         });
        //     }
        // }
    };

    Room.prototype.addSceneryToCanvas = function(instances) {
        this.sceneryCtx.clearRect(0, 0, this.sceneryCtx.canvas.width, this.sceneryCtx.canvas.height);

        let playerTileId = xyToTileId(~~Game.currentPlayer.destPos.x, ~~Game.currentPlayer.destPos.y);
        let localOriginTileX = (playerTileId % Game.worldTileWidth) - 12; // cos 25x25 tiles (including centre tile)
        let localOriginTileY = ~~(playerTileId / Game.worldTileWidth) - 12; // cos 25x25 tiles (including centre tile)
        for (const [sceneryId, tileIds] of instances.entries()) {
            let scenery = Game.sceneryMap.get(Number(sceneryId));
            let spriteFrame = SpriteManager.getSpriteFrameById(scenery.spriteFrameId);
            for (let i = 0; i < tileIds.length; ++i) {
                // get the tileId local to the player (i.e. tileId 0 being the top-left corner, knowing the canvas is 25x25 tiles)
                let tileX = tileIds[i] % Game.worldTileWidth;
                let tileY = ~~(tileIds[i] / Game.worldTileWidth);
                let localTileId = (tileX - localOriginTileX) + ((tileY - localOriginTileY) * Game.worldTileWidth);
                let xy = tileIdToXY(localTileId);
                spriteFrame.draw(this.sceneryCtx, xy.x, xy.y);
            }
        }
    };

    Room.prototype.loadTextureMaps = function(loadedTextures) {
        // this.groundTexturesMap = new Map();
        // let postaction = function(){};

        this.groundTexturesMap = new Map(
            SpriteManager.groundTextures.map(tex => {
                return [tex.id, tex.img];
            })
        );

        this.saveGroundTexturesToCanvas();

        // let loadedImages = 0;
        // let that = this;
        // loadedTextures.forEach((tex) => {
        //     // let imgCanvas = document.createElement("canvas");
        //     // let imgCtx = imgCanvas.getContext("2d");
        //     // imgCanvas.width = tex.img.width;
        //     // imgCanvas.height = tex.img.height;
        //     // imgCtx.width = tex.img.width;
        //     // imgCtx.height = tex.img.height;
        //     // imgCtx.drawImage(tex.img, 0, 0);

        //     // let patternedImage = new Image();
        //     // patternedImage.onload = function() {
        //     //     let pat = imgCtx.createPattern(this, "repeat");
        //     //     that.groundTexturesMap.set(tex.id, pat);

        //     //     if (++loadedImages === loadedTextures.length)
        //     //         postaction();
        //     // }
        //     // patternedImage.src = imgCanvas.toDataURL("image/png");

        //     // let subImgCanvas = document.createElement("canvas");
        //     // subImgCanvas.width = 32;
        //     // subImgCanvas.height = 32;
        //     // subImgCtx = subImgCanvas.getContext("2d");
        //     // subImgCtx.width = 32;
        //     // subImgCtx.height = 32;

        //     // let loadedSubImages = 0;
        //     // let matchingGroundTextures = SpriteManager.groundTextures.filter(e => e.id == tex.id);
        //     // for (let i = 0; i < matchingGroundTextures.length; ++i) {
        //     //     let groundTexture = matchingGroundTextures[i];
        //     //     let imageData = imgCtx.getImageData(groundTexture.getCurrentFrame().left, groundTexture.getCurrentFrame().top, 32, 32);
        //     //     subImgCtx.putImageData(imageData, 0, 0);

        //     //     let subImg = new Image();
        //     //     subImg.onload = function() {
        //     //         let pat = imgCtx.createPattern(this, "repeat");
        //     //         that.groundTexturesMap.set(groundTexture.id, pat);

        //     //         if (++loadedSubImages === matchingGroundTextures.length) {
        //     //             if (++loadedImages === spriteMapIds.length)
        //     //                 postaction();
        //     //         }
        //     //     }
        //     //     subImg.src = subImgCanvas.toDataURL("image/png");
        //     // }
        // });

        // return {
        //     done: function(f) {
        //         postaction = f || postaction;
        //     }
        // }
    };

    Room.prototype.loadNpcs = function(npcJson) {
        for (let i = 0; i < npcJson.length; ++i) {
            Game.npcMap.set(npcJson[i].id, {
                id: npcJson[i].id,
                name: npcJson[i].name,
                upId: npcJson[i].upId,
                downId: npcJson[i].downId,
                leftId: npcJson[i].leftId,
                rightId: npcJson[i].rightId,
                attackId: npcJson[i].attackId,
                scaleX: npcJson[i].scaleX,
                scaleY: npcJson[i].scaleY,
                maxHp: npcJson[i].hp,
                cmb: npcJson[i].cmb,
                leftclickOption: npcJson[i].leftclickOption,
                otherOptions: npcJson[i].otherOptions
            });
        }
    };

    Room.prototype.loadShips = function(shipJson) {
        for (let i = 0; i < shipJson.length; ++i) {
            Game.shipMap.set(shipJson[i].hullSceneryId, {
                id: shipJson[i].hullSceneryId,
                name: shipJson[i].name,
                upId: shipJson[i].upId,
                downId: shipJson[i].downId,
                leftId: shipJson[i].leftId,
                rightId: shipJson[i].rightId,
                leftclickOption: shipJson[i].leftclickOption,
                otherOptions: shipJson[i].otherOptions
            });
        }
    };

    Room.prototype.addPlayer = function (obj) {
        const player = new Game.Player(obj);
        player.stats = new Game.Stats(new Rectangle(0, 0, 0, 0));
        this.otherPlayers.push(player);
    };

    Room.prototype.draw = function (ctx, xview, yview) {
        if (this.currentShow === 0)
            return;

        this.t.reset();
        ctx.save();

        this.t.scale(Game.scale, Game.scale);
        ctx.setTransform.apply(ctx, this.t.m);

        // draw the ground textures
        let minx = this.player.destPos.x - this.player.combatOffsetX - xview - (12*32);
        let miny = (this.player.destPos.y - yview - (12*32));

        const canvasWidth = this.groundTextureCtx.canvas.width;
        const canvasHeight = this.groundTextureCtx.canvas.height;
        
        ctx.filter = `brightness(${Game.brightness})`;
        ctx.drawImage(this.groundTextureCtx.canvas, minx-16, miny-16);
        ctx.filter = "none";

        ctx.save();

        let lightsources = new Map();
        let shadows = new Map();
        this.sceneryInstancesBySceneryId
            .forEach((tileIds, sceneryId) => {
                const scenery = Game.sceneryMap.get(Number(sceneryId));
                if (scenery) {
                    if (scenery.lightsourceRadius) {
                        if (!lightsources.has(scenery.lightsourceRadius))
                            lightsources.set(scenery.lightsourceRadius, []);
                        lightsources.set(scenery.lightsourceRadius, lightsources.get(scenery.lightsourceRadius).concat(tileIds));
                    } else {
                        // shadows
                        const spriteFrame = SpriteManager.getSpriteFrameById(scenery.spriteFrameId);
                        const frameWidth = spriteFrame.getCurrentFrame().width * 0.25; // halved because it's used as a radius
                        if (!shadows.has(frameWidth))
                            shadows.set(frameWidth, []);
                        shadows.set(frameWidth, shadows.get(frameWidth).concat(tileIds));
                    }
                }
            });

        this.constructableInstancesById
            .forEach((tileIds, sceneryId) => {
                const scenery = Game.sceneryMap.get(Number(sceneryId));
                if (scenery && scenery.lightsourceRadius) {
                    if (!lightsources.has(scenery.lightsourceRadius))
                        lightsources.set(scenery.lightsourceRadius, []);
                    lightsources.set(scenery.lightsourceRadius, lightsources.get(scenery.lightsourceRadius).concat(tileIds));
                }
            });

        // TODO move the shadows to the ground texture render as they don't move once set
        if (Game.drawShadows) {
            ctx.save();

            ctx.filter = "none";

            ctx.beginPath();
            shadows.forEach((tileIds, radius) => {
                tileIds.forEach(tileId => {
                    const xy = tileIdToXY(tileId);
                    ctx.moveTo(xy.x - xview, xy.y - yview);
                    ctx.ellipse(xy.x - xview, xy.y - yview, radius, radius * 0.5, 0, 0, 2 * Math.PI);
                });
            });
            ctx.clip();
            ctx.closePath();
            if (shadows.size) {
                ctx.filter = `brightness(${Math.min(0.7, Game.brightness)})`;
                ctx.drawImage(this.groundTextureCtx.canvas, minx-16, miny-16);
                ctx.filter = "none";
            }
            ctx.restore();
        }

        ctx.beginPath();
        lightsources.forEach((tileIds, radius) => {
            tileIds.forEach(tileId => {
                const offX = Math.random(-3, 3);
                const offY = Math.random(-3, 3);
                const offSize = Math.random(-3, 3);

                // let grd = ctx.createRadialGradient(
                //     xy.x - xview + offX, 
                //     xy.y - yview + offY,
                //     radius + offSize, 
                //     xy.x - xview + offX, 
                //     xy.y - yview + offY,
                //     (radius + offSize) * 1.25);
                // grd.addColorStop(0, "rgba(255, 255, 102, 0.1");
                // grd.addColorStop(1, "rgba(255, 0, 0, 0");
                // ctx.fillStyle = grd;
                // ctx.fillRect(0, 0, 800, 800);

                const xy = tileIdToXY(tileId);
                ctx.moveTo(xy.x - xview + offX, xy.y - yview + offY);
                ctx.ellipse(xy.x - xview + offX, xy.y - yview + offY, (radius*1.25) + offSize, radius + offSize, 0, 0, 2 * Math.PI);
            });
        });
        
        ctx.clip(); //call the clip method so the next render is clipped in last path
        // ctx.shadowColor = "white";
        // ctx.shadowBlur = 30;
        // ctx.globalCompositeOperation = "destination-out";
        // ctx.shadowOffsetX = 500;
        ctx.closePath();
        
        if (lightsources.size)
            ctx.drawImage(this.groundTextureCtx.canvas, minx-16, miny-16);
            
        ctx.restore();

        ctx.save();// make the items on the ground smaller than in the inventory
        ctx.scale(0.5, 0.5);

        const hoverItems = this.groundItems.filter(item => {
            const rect = new Rectangle(
                item.clickBox.left - xview, 
                item.clickBox.top - yview, 
                item.clickBox.width, 
                item.clickBox.height);

            return rect.pointWithin({x: Game.mousePos.x / Game.scale, y: Game.mousePos.y / Game.scale}) &&
                Game.worldCameraRect.pointWithin(Game.mousePos);
        });

        const glowingItemIndex = hoverItems.length ? this.groundItems.indexOf(hoverItems[hoverItems.length - 1]) : -1;
        
        for (let i = 0; i < this.groundItems.length; ++i) {
            // if (i === glowingItemIndex) {
            //     ctx.save();
            //     ctx.shadowBlur = 10;
            //     ctx.shadowColor = "red";
            // }
            this.groundItems[i].draw(ctx, xview, yview, 0.5, 0.5);
            // if (i === glowingItemIndex) {
            //     ctx.restore();
            // }
        }
        ctx.restore();

        if (Game.activeUiWindow == null) {// if there's a window up then don't show hover texts for items behind it
            if (glowingItemIndex >= 0 && Game.currentPlayer.inventory.slotInUse == null) {
                Game.ContextMenu.setLeftclick(Game.mousePos, {
                    id: Game.currentPlayer.id,
                    action: "take", 
                    objectName: this.groundItems[glowingItemIndex].item.name, 
                    itemId: this.groundItems[glowingItemIndex].item.id,
                    tileId: this.groundItems[glowingItemIndex].tileId
                });
            }
        }

        this.drawLegacy(ctx, xview, yview);

        for (let i = 0; i < this.teleportExplosions.length; ++i) {
            ctx.save();
            let lifetime = (1 - this.teleportExplosions[i].lifetime); // 0 -> 1
            let size = Math.sin(1 - lifetime) * 64;

            ctx.globalAlpha = 1 - lifetime;
            ctx.fillStyle = `rgb(${lifetime * 255}, 255, ${(1 - lifetime) * 255}`;

            ctx.beginPath();
            ctx.arc(this.teleportExplosions[i].x - xview, 
                    this.teleportExplosions[i].y - yview, size, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }

        // these draw calls still draw stuff like the death curtain, health bars, chat etc so draw these last.
        this.player.draw(ctx, xview, yview);
        for (var i in this.otherPlayers) {
            this.otherPlayers[i].draw(ctx, xview, yview);
        }

        for (var i in this.npcs) {
            this.npcs[i].draw(ctx, xview, yview);
        }

        for (var i in this.ships) {
            this.ships[i].draw(ctx, xview, yview);
        }

        if (Game.fog) {
            const xpos = (Game.worldCameraRect.left + (Game.worldCameraRect.width * 0.5)) / Game.scale;
            const ypos = (Game.worldCameraRect.top + (Game.worldCameraRect.height * 0.5)) / Game.scale;

            // left/right edges
            this.setFog(ctx, xpos, ypos, [xpos - 340, 0, xpos + 340, 0])

            // top/bottom edges
            this.setFog(ctx, xpos, ypos, [0, ypos - 340, 0, ypos + 340])
        }
        var mp = Game.mousePos || { x: 0, y: 0 };
        var transformed = this.t.transformPoint(mp.x, mp.y);
        
        
        Game.cursor.setPos({ x: transformed.x + xview, y: transformed.y + yview });
        Game.cursor.draw(ctx, xview, yview);

        ctx.restore();
    };

    Room.prototype.setFog = function(ctx, xpos, ypos, coords) {
        let grd = ctx.createLinearGradient(coords[0], coords[1], coords[2], coords[3])
        grd.addColorStop(0, "rgba(0, 0, 0, 1)");
        grd.addColorStop(0.01, "rgba(0, 0, 0, 0)");
        grd.addColorStop(0.99, "rgba(0, 0, 0, 0)");
        grd.addColorStop(1, "rgba(0, 0, 0, 1)");
        ctx.fillStyle = grd;
        ctx.fillRect(xpos - 500, ypos - 500, 1000, 1000);
    }

    Room.prototype.drawLegacy = function(ctx, xview, yview) {
        // add everything to the draw map so we can draw in the correct order
        var drawMap = new Map();

        // add the NPCs
        for (var i = 0; i < this.npcs.length; ++i) {
            let currentSpriteFrame = this.npcs[i].getCurrentSpriteFrame();
            let mapKey = this.npcs[i].pos.y + (currentSpriteFrame.getCurrentFrame().height * currentSpriteFrame.scale.y) - ((currentSpriteFrame.anchor.y * currentSpriteFrame.getCurrentFrame().height) * currentSpriteFrame.scale.y);
            if (!drawMap.has(mapKey))
                drawMap.set(mapKey, []);

            const isAttackable = this.npcs[i].get("leftclickOption") === 1;
            drawMap.get(mapKey).push({
                id: this.npcs[i].instanceId,
                name: this.npcs[i].get("name") + (isAttackable ? ` (lvl ${this.npcs[i].get("cmb")})` : ""),
                x: this.npcs[i].pos.x, 
                y: this.npcs[i].pos.y - (this.npcs[i].deathTimer * 32),
                sprite: [this.npcs[i].getCurrentSpriteFrame()],
                type: "npc",
                leftclickOption: this.npcs[i].ownerId === Game.currentPlayer.id ? 64 : this.npcs[i].get("leftclickOption"),
                label: this.npcs[i].getLeftclickLabel(),
                transparency: Math.max(1 - this.npcs[i].deathTimer, 0.01)
            });
        }

        for (var i = 0; i < this.ships.length; ++i) {
            let currentSpriteFrame = this.ships[i].getCurrentSpriteFrame();
            let mapKey = this.ships[i].pos.y + (currentSpriteFrame.getCurrentFrame().height * currentSpriteFrame.scale.y) - ((currentSpriteFrame.anchor.y * currentSpriteFrame.getCurrentFrame().height) * currentSpriteFrame.scale.y);
            if (!drawMap.has(mapKey))
                drawMap.set(mapKey, []);

            drawMap.get(mapKey).push({
                id: this.ships[i].instanceId,
                name: this.ships[i].get("name"),
                x: this.ships[i].pos.x, 
                y: this.ships[i].pos.y,
                sprite: [this.ships[i].getCurrentSpriteFrame()],
                type: "ship",
                tileId: this.ships[i].getTileId(),
                leftclickOption: this.ships[i].get("leftclickOption"),
                label: `${Game.currentPlayer.onboardShip ? "disembark" : "board"} ${this.ships[i].get("name")}`
            });
        }

        // add the other players
        for (var i in this.otherPlayers) {
            let currentSpriteFrame = this.otherPlayers[i].getCurrentSpriteFrames()[0];
            let mapKey = this.otherPlayers[i].y + (currentSpriteFrame.getCurrentFrame().height * currentSpriteFrame.scale.y) - ((currentSpriteFrame.anchor.y * currentSpriteFrame.getCurrentFrame().height) * currentSpriteFrame.scale.y);
            if (!drawMap.has(mapKey))
                drawMap.set(mapKey, []);

            drawMap.get(mapKey).push({
                id: this.otherPlayers[i].id,
                name: this.otherPlayers[i].name + ` (lvl ${this.otherPlayers[i].combatLevel})`,
                x: this.otherPlayers[i].x, 
                y: this.otherPlayers[i].y - (this.otherPlayers[i].deathSequence ? ((1 - this.otherPlayers[i].deathsCurtain) * 32) : 0),
                sprite: this.otherPlayers[i].getCurrentSpriteFrames(),
                type: "player",
                leftclickOption: 0,
                transparency: this.otherPlayers[i].deathSequence ? Math.max(this.otherPlayers[i].deathsCurtain, 0.01) : 1
            });
        }

        // add the current player (unless we're on a ship)
        if (!this.player.onboardShip) {
            let playerSpriteFrame = this.player.getCurrentSpriteFrame();
            let mapKey = this.player.y + (playerSpriteFrame.getCurrentFrame().height * playerSpriteFrame.scale.y) - ((playerSpriteFrame.anchor.y * playerSpriteFrame.getCurrentFrame().height) * playerSpriteFrame.scale.y);
            if (!drawMap.has(mapKey))
                drawMap.set(mapKey, []);
                
            drawMap.get(mapKey).push({
                id: this.player.id,
                name: this.player.name,
                x: this.player.x, 
                y: this.player.y,
                sprite: this.player.getCurrentSpriteFrames(),
                type: "player",
                leftclickOption: 0
            });
        }

        // add scenery
        this.compileDrawableSceneryMap(xview, yview);
        this.drawableSceneryMap.forEach(function(value, key, map) {
            if (!drawMap.has(key))
                drawMap.set(key, []);
            drawMap.set(key, drawMap.get(key).concat(value));
        });

        // active spells
        for (let i = 0; i < this.spells.length; ++i) {
            if (!drawMap.has(this.spells[i].pos.y)) {
                drawMap.set(this.spells[i].pos.y, []);
            }
            drawMap.get(this.spells[i].pos.y).push({
                x: this.spells[i].pos.x,
                y: this.spells[i].pos.y,
                sprite: [this.spells[i].spriteFrame]
            });
        }

        const orderedDrawMap = new Map([...drawMap.entries()].sort());// order by ypos
        orderedDrawMap.forEach(function(value, key, map) {
            for (let i = 0; i < value.length; ++i) {
                ctx.globalAlpha = value[i].transparency || 1;

                const clickBox = value[i].sprite[0].getBoundingBox();
                const rect = new Rectangle(value[i].x + clickBox.left - xview,
                                                value[i].y + clickBox.top - yview,
                                                clickBox.width, clickBox.height);
                
                const mouseOver = rect.pointWithin({x: Game.mousePos.x / Game.scale, y: Game.mousePos.y / Game.scale}) && Game.worldCameraRect.pointWithin(Game.mousePos);
                const unusable = ((value[i].attributes || 0) & 1) === 1 && value[i].type === "scenery";
                const slotInUse = Game.currentPlayer.inventory.slotInUse;

                if (!Game.activeUiWindow && mouseOver && (slotInUse && !unusable)) {
                    // draw the back-image
                    ctx.save();
                    ctx.shadowBlur = 3;
                    ctx.shadowColor = "white";
                    for (let j = 0; j < value[i].sprite.length; ++j)
                        value[i].sprite[j].draw(ctx, value[i].x - xview, value[i].y - yview, value[i].sprite[j].color);
                    ctx.restore();
                }
                
                for (let j = 0; j < value[i].sprite.length; ++j) {
                    value[i].sprite[j].draw(ctx, value[i].x - xview, value[i].y - yview, value[i].sprite[j].color);
                    if (value[i].sprite[j].glow) {
                        ctx.restore();
                    }
                }

                if (!Game.activeUiWindow) {
                    // mouse position needs to account for scale because the whole context is currently scaled
                    if (mouseOver) {
                        if (Game.drawBoundingBoxes) {
                            ctx.strokeStyle = "red";
                            ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

                            ctx.strokeStyle = "blue";
                            ctx.beginPath();
                            ctx.moveTo(rect.left, key - yview);
                            ctx.lineTo(rect.right, key - yview);
                            ctx.stroke();
                        }

                        if (slotInUse && value[i].name && !unusable) {
                            Game.ContextMenu.setLeftclick(Game.mousePos, {
                                id: Game.currentPlayer.id,
                                action: "use",
                                src: slotInUse.item.id,
                                dest: value[i].tileId,
                                type: value[i].type,
                                label: "use {0} -> {1}".format(slotInUse.item.name, value[i].name)
                            });
                        } else {
                            if (value[i].leftclickOption) {
                                var label = value[i].label || "";
                                var contextOpt = Game.ContextMenu.getContextOptionById(value[i].leftclickOption, value[i].type);
                                Game.ContextMenu.setLeftclick(Game.mousePos, {
                                    id: Game.currentPlayer.id,
                                    action: contextOpt.name,
                                    objectName: value[i].name,
                                    objectId: value[i].id,
                                    tileId: value[i].tileId,
                                    type: value[i].type,
                                    label: label
                                });
                            }
                        }
                    }
                }
            }
        });
    };

    Room.prototype.process = function (dt) {
        this.currentShow += (this.show - this.currentShow) * dt;

        // we need to figure out which players/npcs/scenery moved in the past frame,
        // so that we only redraw them when necessary.  moving can mean physically changing
        // position, or having the sprite update (e.g. fires, fishing spots).

        // there are certain cases where something can either move or just change sprite while 
        // standing still (e.g. butterfly), or future idle animations for npcs/players,
        // so we will need to save the previous/current positions AND sprite frames, then filter
        // for all the things that had a modification in either of the two.
        let playerPrevPositions = new Map();
        let playerNewPositions = new Map();
        playerPrevPositions.set(this.player.id, {x: this.player.x, y: this.player.y, spriteFrame: this.player.getBaseSpriteFrame().currentFrame});
        this.player.process(dt);
        playerNewPositions.set(this.player.id, {x: this.player.x, y: this.player.y, spriteFrame: this.player.getBaseSpriteFrame().currentFrame});
        for (let i in this.otherPlayers) {
            playerPrevPositions.set(this.otherPlayers[i].id, {x: this.otherPlayers[i].x, y: this.otherPlayers[i].y, spriteFrame: this.player.getBaseSpriteFrame().currentFrame});
            this.otherPlayers[i].process(dt);
            playerPrevPositions.set(this.otherPlayers[i].id, {x: this.otherPlayers[i].x, y: this.otherPlayers[i].y, spriteFrame: this.player.getBaseSpriteFrame().currentFrame});
        }

        this.ships.forEach(ship => ship.process(dt));

        let changedPlayerIds = [];
        for (let [key, value] of playerPrevPositions.entries()) {
            if (!playerNewPositions[key])
                continue;
            
            if (playerNewPositions[key].x !== value.x 
                    || playerNewPositions[key].y !== value.y 
                    || playerNewPositions.spriteFrame !== value.spriteFrame) {
                        changedPlayerIds.add(key)
            }
        }

        let npcPrevPositions = new Map();
        let npcNewPositions = new Map();
        this.npcs = this.npcs.filter(npc => npc.deathTimer < 1);
        for (let i in this.npcs) {
            npcPrevPositions.set(this.npcs[i].instanceId, {x: this.npcs[i].pos.x, y: this.npcs[i].pos.y, spriteFrame: this.npcs[i].getCurrentSpriteFrame().currentFrame});
            this.npcs[i].process(dt);
            npcNewPositions.set(this.npcs[i].instanceId, {x: this.npcs[i].pos.x, y: this.npcs[i].pos.y, spriteFrame: this.npcs[i].getCurrentSpriteFrame().currentFrame});
        }

        let changedNpcInstanceIds = [];
        for (let [key, value] of npcPrevPositions.entries()) {
            if (!npcNewPositions[key])
                continue;

            if (npcNewPositions[key].x !== value.x 
                || npcNewPositions[key].y !== value.y 
                || npcNewPositions.spriteFrame !== value.spriteFrame) {
                    changedNpcInstanceIds.add(key)
            }
        }

        // scenery never moves, so we just need to record the sprite frame
        let sceneryPrevPositions = new Map();
        let sceneryNewPositions = new Map();
        this.drawableSceneryMap.forEach(function(value, key, map) {
            for (let i in value) {
                sceneryPrevPositions.set(value[i].tileId, value[i].sprite[0].currentFrame)
                value[i].sprite[0].process(dt);
                sceneryNewPositions.set(value[i].tileId, value[i].sprite[0].currentFrame)
            }
        });

        let changedSceneryInstanceIds = [];
        for (let [key, value] of sceneryPrevPositions.entries()) {
            if (!sceneryNewPositions[key])
                continue;

            if (sceneryNewPositions[key].x !== value.x 
                || sceneryNewPositions[key].y !== value.y 
                || sceneryNewPositions.spriteFrame !== value.spriteFrame) {
                    changedSceneryInstanceIds.add(key)
            }
        }
        
        this.spells.forEach(e => e.process(dt));
        this.spells = this.spells.filter(spell => spell.lifetime > 0);

        this.teleportExplosions.forEach(e => e.lifetime -= dt);
        this.teleportExplosions = this.teleportExplosions.filter(e => e.lifetime > 0);

        Game.Minimap.setOtherPlayers(this.otherPlayers);
        Game.Minimap.setGroundItems(this.groundItems);
        Game.Minimap.setNpcs(this.npcs);
    };

    Room.prototype.updateGroundTextures = function() {
        // we can group identical tiles and draw them once as a group with a repeating texture
        // e.g. 
        // grass=0, dirt=1
        /*
            now: 100 draw calls
            0000000000
            0000000000
            1111110000
            0000010000
            0000010000
            0000010000
            0000011100
            0000000100
            0011111100
            0010000000
        
            optimized ('-'=unprocessed grass, "="=unprocessed dirt): 13 draw calls
            0---------
            ----------
            1=====0---
            0----1----
            -----=----
            -----=----
            -----=1=0-
            -----0-1--
            0-1=====--
            --10------

            algorithm:
            We know that we've got a grid of x*y, let's say 10*10, sorted by y, x
            Starting from the top-left tile, we branch out once left, then once down.
            We keep branching out alternating left and down, until we either hit a different
            tile or we hit the last element in the row/column.
            When we hit the first different tile/last element, we just continue down the other
            direction until we hit the end of that one too.
            The final result is the square of tiles that we will group into a single draw call.
            All of the tiles in the draw call are marked as processed.
            Now repeat over and over with the first "unprocessed" tile until there's no more tiles.

        */
        let gridW = 25;
        let gridH = 25;

        let data = this.drawableTextureInstances.map(texId => ({id: texId, processed: false}));
        this.optimizedDrawableTextureInstance = new Map();

        let counter = 0;
        while (++counter < 25*25) { 
            // run through the array until we find the first unprocessed element
            let firstEle = null;
            for (let i = 0; i < data.length; ++i) {
                if (!data[i]) {
                    continue;
                }

                if (!data[i].processed) {
                    firstEle = i;
                    break;
                }
            }

            // if all the elements are processed then we're finished
            if (firstEle == null)
                break;

            // x/y position of the element as a 2d array
            let posX = firstEle % gridW;
            let posY = ~~(firstEle / gridW);

            let x, y, len;
            let textureId = this.drawableTextureInstances[firstEle];

            outer:
            for (y = posY; y < gridH; ++y) {
                for (x = posX; x < (len || gridW); ++x) {
                    let testNode = data[x + (y * gridW)];
                    if (!testNode || testNode.processed === true || testNode.id !== textureId) {
                        if (y === posY) {
                            len = x;
                        } else {
                            break outer;
                        }
                    }
                }

                if (!len)
                    len = gridW;
            }
            x = len - 1;
            --y;

            // mark all the successful nodes in the rect as processed
            for (let j = posY; j <= y; ++j) {
                for (let i = posX; i <= x; ++i) {
                    data[i + (j * gridW)].processed = true;
                }
            }

            let w = x - posX + 1;
            let h = y - posY + 1;

            if (!this.optimizedDrawableTextureInstance.has(textureId)) 
                this.optimizedDrawableTextureInstance.set(textureId, []);

            this.optimizedDrawableTextureInstance.get(textureId).push({
                x: (~~(firstEle%gridW) * 32), 
                y: (~~(firstEle/gridW) * 32), 
                w: w * 32, 
                h: h * 32, 
                textureId: textureId
            });
        }

        // save the current ground textures to a background canvas, then we can draw it in a single draw call each frame
        this.saveGroundTexturesToCanvas();
    };

    Room.prototype.saveGroundTexturesToCanvas = function() {
        let ctx = this.groundTextureCtx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // take the ground texture with the most instances and draw it first as the entire background
        let textureWithMostInstances = 0;
        let mostInstances = 0;
        for (const [key, value] of this.optimizedDrawableTextureInstance) {
            mostInstances = Math.max(mostInstances, value.length);
            if (mostInstances === value.length)
                textureWithMostInstances = key;
        }

        if (textureWithMostInstances > 0) {
            ctx.fillStyle = this.groundTexturesMap.get(textureWithMostInstances) || "black";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        for (const [key, value] of this.optimizedDrawableTextureInstance) {
            if (key === textureWithMostInstances)
                continue;

            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < value.length; ++i) {
                ctx.rect(value[i].x, value[i].y, value[i].w, value[i].h);
            }

            ctx.fillStyle = this.groundTexturesMap.get(key) || "black";
            ctx.fill();

            ctx.restore();
        }
    };

    Room.prototype.compileDrawableSceneryMap = function(xview, yview) {
        this.drawableSceneryMap = this.sceneryInstances;
    };

    Room.prototype.refreshGroundItems = function(obj) {
        // {tileId: [itemId, itemId, itemId, ...]}
        // {31221: [55, 27, ...]}

        let groundItems = [];
        for (let tileId in obj) {
            for (let i = 0; i < obj[tileId].length; ++i) {
                groundItems.push(new GroundItem(tileId, obj[tileId][i]));
            }
        }
        this.groundItems = groundItems;
    }
	
	Game.Room = new Room();
})();