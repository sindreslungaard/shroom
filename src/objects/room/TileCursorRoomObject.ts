import { RoomObject } from "../RoomObject";
import * as PIXI from "pixi.js";
import { RoomPosition } from "../../types/RoomPosition";
import { getZOrder } from "../../util/getZOrder";
import { Subscription } from "rxjs";

export class TileCursorRoomObject extends RoomObject {

    private _container: PIXI.Container
    private _isBehindWall: boolean
    private _subscription: Subscription | undefined

    constructor() {
        super();
        this._container = new PIXI.Container();
        this._isBehindWall = false

        let graphics = new PIXI.Graphics()
        drawBorder(graphics, 0x000000, 0.33, 0);
        drawBorder(graphics, 0xa7d1e0, 1, -2);
        drawBorder(graphics, 0xffffff, 1, -3);
        this._container.addChild(graphics)
        this._container.visible = false
    }

    registered() {
        this.roomVisualization.container.addChild(this._container);
        this._subscription = this.room.onActiveTileChange.subscribe(this.observer())
    }

    destroyed() {
        if(this._subscription) {
            this._subscription.unsubscribe()
        }
        this._container.destroy()
    }

    observer() {
        let self = this

        return {
            next(value: RoomPosition) {

                if(!value) {
                    self._container.visible = false
                    return
                }

                if(!self._container.visible) {
                    self._container.visible = true
                }

                let tile = self.tilemap.getTileAtPosition(value.roomX, value.roomY)

                if(tile?.type === "door") {

                    self.roomVisualization.container.removeChild(self._container)
                    self.roomVisualization.behindWallContainer.addChild(self._container)
                    self._isBehindWall = true

                } else if(self._isBehindWall) {
                    self.roomVisualization.behindWallContainer.removeChild(self._container)
                    self.roomVisualization.container.addChild(self._container)
                    self._isBehindWall = false
                }

                const { x, y } = self.geometry.getPosition(value.roomX, value.roomY, value.roomZ);

                self._container.zIndex = getZOrder(value.roomX, value.roomY, value.roomZ) - 1000

                self._container.x = x
                self._container.y = y

            }
        }
    }
    
}

const points = {
    p1: { x: 0, y: 16 },
    p2: { x: 32, y: 0 },
    p3: { x: 64, y: 16 },
    p4: { x: 32, y: 32 },
};

function drawBorder(
    graphics: PIXI.Graphics,
    color: number,
    alpha = 1,
    offsetY: number
  ) {
    graphics.beginFill(color, alpha);
    graphics.moveTo(points.p1.x, points.p1.y + offsetY);
    graphics.lineTo(points.p2.x, points.p2.y + offsetY);
    graphics.lineTo(points.p3.x, points.p3.y + offsetY);
    graphics.lineTo(points.p4.x, points.p4.y + offsetY);
    graphics.endFill();
  
    graphics.beginHole();
    graphics.moveTo(points.p1.x + 6, points.p1.y + offsetY);
    graphics.lineTo(points.p2.x, points.p2.y + 3 + offsetY);
    graphics.lineTo(points.p3.x - 6, points.p3.y + offsetY);
    graphics.lineTo(points.p4.x, points.p4.y - 3 + offsetY);
    graphics.endHole();
}