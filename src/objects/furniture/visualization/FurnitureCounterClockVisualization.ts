import { IFurnitureVisualizationLayer, IFurnitureVisualizationView } from "../IFurnitureVisualizationView";
import { AnimatedFurnitureVisualization } from "./AnimatedFurnitureVisualization";
import { FurnitureVisualization } from "./FurnitureVisualization";

export class FurnitureCounterClockVisualization extends FurnitureVisualization {

    private static readonly SECONDS_SPRITE: string       = 'seconds_sprite';
    private static readonly TEN_SECONDS_SPRITE: string   = 'ten_seconds_sprite';
    private static readonly MINUTES_SPRITE: string       = 'minutes_sprite';
    private static readonly TEN_MINUTES_SPRITE: string   = 'ten_minutes_sprite';
  
    private _base: AnimatedFurnitureVisualization = new AnimatedFurnitureVisualization();

    constructor() {
        super()
    }
  
    isAnimated(): boolean {
      return true;
    }
  
    destroy(): void {
      this._base.destroy();
    }
  
    update(): void {
      this._base.update();
    }
  
    setView(view: IFurnitureVisualizationView) {
      super.setView(view);
      this._base.setView(view);
      this._base.lockCurrentFrameIndex = true
    }
  
    updateFrame(frame: number): void { 
      this._base.updateFrame(frame);
    }
  
    updateDirection(direction: number): void {
      this._base.updateDirection(direction);
    }
  
    updateAnimation(animation: string): void {
        
        this._base.updateAnimation(animation);

        this.view.getLayers().forEach(layer => {

            switch(layer.tag) {
                case FurnitureCounterClockVisualization.SECONDS_SPRITE: layer.setCurrentFrameIndex(Math.floor((parseInt(animation) % 60) % 10)); break;
                case FurnitureCounterClockVisualization.TEN_SECONDS_SPRITE: layer.setCurrentFrameIndex(Math.floor((parseInt(animation) % 60) / 10)); break;
                case FurnitureCounterClockVisualization.MINUTES_SPRITE: layer.setCurrentFrameIndex(Math.floor((parseInt(animation) / 60) % 10)); break;
                case FurnitureCounterClockVisualization.TEN_MINUTES_SPRITE: layer.setCurrentFrameIndex(Math.floor(((parseInt(animation) / 60) / 10) % 10)); break;
            }

            return layer
        })

    }
  }
  