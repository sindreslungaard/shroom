import { TileType } from "../../types/TileType";
import { parseTileMap } from "../../util/parseTileMap";

export class ParsedTileMap {
  private _data: ReturnType<typeof parseTileMap>;

  public get largestDiff() {
    return this._data.largestDiff;
  }

  public get parsedTileTypes() {
    return this._data.tilemap;
  }

  public get wallOffsets() {
    return this._data.wallOffsets;
  }

  public sizeX: number = 0
  public sizeY: number = 0

  constructor(public tilemap: TileType[][]) {
    this.sizeY = tilemap.length
    if(this.sizeY > 0) {
      this.sizeX = tilemap[0].length
    }
    this._data = parseTileMap(tilemap);
  }
}
