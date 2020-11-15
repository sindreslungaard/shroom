import * as PIXI from "pixi.js";

import { parseTileMapString } from "./util/parseTileMapString";
import { FloorFurniture } from "./objects/furniture/FloorFurniture";
import { AnimationTicker } from "./AnimationTicker";

import TileAsset from "./assets/tile.png";
import TileAsset2 from "./assets/tile2.png";
import WallAsset from "./assets/wall.png";
import WallAsset2 from "./assets/wall2.png";
import WallAsset3 from "./assets/wall3.png";
import { Room } from "./objects/room/Room";
import { Avatar } from "./objects/avatar/Avatar";
import { loadRoomTexture } from "./util/loadRoomTexture";

const view = document.querySelector("#root") as HTMLCanvasElement | undefined;
const container = document.querySelector("#container") as
  | HTMLDivElement
  | undefined;
if (view == null || container == null) throw new Error("Invalid view");

const application = new PIXI.Application({
  view,
  antialias: false,
  resolution: window.devicePixelRatio,
  autoDensity: true,
  width: 1600,
  height: 900,
  backgroundColor: 0x000000,
});

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

const room = Room.create({
  application,
  tilemap: `
      1111111111
      1111111111
      11111x1111
      11111x0000
      11111x0000
      11111x0000
      00000x0000
      0000000000
      0000000000
      0000000000
      0000000000
    `,
});

room.wallTexture = loadRoomTexture(WallAsset3);
room.wallColor = "#55ffff";

room.floorTexture = loadRoomTexture(TileAsset);

room.x = application.screen.width / 2 - room.roomWidth / 2;
room.y = application.screen.height / 2 - room.roomHeight / 2;

room.addRoomObject(
  new FloorFurniture({
    type: "edicehc",
    direction: 0,
    roomX: 1,
    roomY: 1,
    roomZ: 1,
    animation: "1",
  })
);

const avatar = new Avatar({
  look: "hd-605-2.hr-3012-45.ch-645-109.lg-720-63.sh-725-92.wa-2001-62",
  direction: 2,
  roomX: 0,
  roomY: 0,
  roomZ: 1,
});

avatar.action = "std";
avatar.waving = false;
avatar.direction = 2;
avatar.drinking = false;

setTimeout(() => {}, 5000);

room.addRoomObject(avatar);

application.stage.addChild(room);

createButton("Turn", () => {
  avatar.direction = (avatar.direction + 1) % 8;
});

createButton("Walk", () => {
  avatar.action = "wlk";
});

createButton("Lay", () => {
  avatar.action = "lay";
});

createButton("Sit", () => {
  avatar.action = "sit";
});

createButton("Wave", () => {
  avatar.waving = !avatar.waving;
});

function createButton(label: string, onClick: () => void) {
  const button = document.createElement("button");
  button.innerText = label;
  button.addEventListener("click", onClick);
  document.body.appendChild(button);
}
