import { AvatarDrawDefinition, createLookServer, LookServer } from "./util";
import { LookOptions } from "./util/createLookServer";
import {
  AvatarLoaderResult,
  IAvatarLoader,
} from "../../interfaces/IAvatarLoader";
import { HitTexture } from "../hitdetection/HitTexture";
import Bluebird from "bluebird";
import { AvatarAnimationData } from "./util/data/AvatarAnimationData";
import { FigureMapData } from "./util/data/FigureMapData";
import { AvatarOffsetsData } from "./util/data/AvatarOffsetsData";
import { AvatarPartSetsData } from "./util/data/AvatarPartSetsData";
import { FigureData } from "./util/data/FigureData";
import { AvatarActionsData } from "./util/data/AvatarActionsData";
import { AvatarGeometryData } from "./util/data/AvatarGeometryData";
import { AvatarAction } from "./enum/AvatarAction";
import { AvatarEffectData } from "./util/data/AvatarEffectData";
import { IAvatarEffectData } from "./util/data/interfaces/IAvatarEffectData";
import { IAssetBundle } from "../../assets/IAssetBundle";
import { LegacyAssetBundle } from "../../assets/LegacyAssetBundle";
import { ShroomAssetBundle } from "../../assets/ShroomAssetBundle";
import {
  AvatarEffect,
  IAvatarEffectMap,
} from "./util/data/interfaces/IAvatarEffectMap";
import { AvatarEffectMap } from "./util/data/AvatarEffectMap";
import { IAvatarEffectBundle } from "./util/data/interfaces/IAvatarEffectBundle";
import { AvatarEffectBundle } from "./AvatarEffectBundle";
import { getLibrariesForLook } from "./util/getLibrariesForLook";
import { parseLookString } from "./util/parseLookString";
import {
  AvatarDependencies,
  getAvatarDrawDefinition,
} from "./util/getAvatarDrawDefinition";
import { IAvatarOffsetsData } from "./util/data/interfaces/IAvatarOffsetsData";
import { AvatarAssetLibraryCollection } from "./AvatarAssetLibraryCollection";
import { ManifestLibrary } from "./util/data/ManifestLibrary";
import { IManifestLibrary } from "./util/data/interfaces/IManifestLibrary";

interface Options {
  getAssetBundle: (library: string) => Promise<IAssetBundle>;
  getEffectMap: () => Promise<IAvatarEffectMap>;
  getEffectBundle: (effectData: AvatarEffect) => Promise<IAvatarEffectBundle>;
  createDependencies: () => Promise<AvatarDependencies>;
}

const directions = [0, 1, 2, 3, 4, 5, 6, 7];

const preloadActions = new Set([
  AvatarAction.Default,
  AvatarAction.Move,
  AvatarAction.Sit,
]);

function _getLookOptionsString(lookOptions: LookOptions) {
  const parts: string[] = [];

  if (lookOptions.actions.size > 0) {
    const actionString = Array.from(lookOptions.actions)
      .map((action) => action)
      .join(",");
    parts.push(`actions(${actionString})`);
  }

  parts.push(`direction(${lookOptions.direction})`);
  parts.push(`headdirection(${lookOptions.headDirection})`);

  if (lookOptions.item != null) {
    parts.push(`item(${lookOptions.item})`);
  }

  if (lookOptions.look != null) {
    parts.push(`look(${lookOptions.look})`);
  }

  if (lookOptions.effect != null) {
    parts.push(`effect(${lookOptions.effect})`);
  }

  return parts.join(",");
}

export class AvatarLoader implements IAvatarLoader {
  private _globalCache: Map<string, Promise<HitTexture>> = new Map();
  private _lookServer: Promise<LookServer>;
  private _effectCache: Map<string, Promise<IAvatarEffectData>> = new Map();
  private _lookOptionsCache: Map<string, AvatarDrawDefinition> = new Map();
  private _assetBundles: Map<string, Promise<IManifestLibrary>> = new Map();
  private _effectMap: Promise<IAvatarEffectMap>;
  private _dependencies: Promise<AvatarDependencies>;
  private _offsets = new AvatarAssetLibraryCollection();

  constructor(private _options: Options) {
    this._dependencies = this._options.createDependencies();

    this._lookServer = this._dependencies
      .then(async (dependencies) => {
        // Wait for the placeholder model to load
        return createLookServer({
          ...dependencies,
          offsetsData: this._offsets,
        });
      })
      .then(async (server) => {
        await this._getAvatarDrawDefinition(server, {
          direction: 0,
          headDirection: 0,
          actions: new Set(),
          look: "hd-99999-99999",
        });

        return server;
      });

    this._effectMap = this._options.getEffectMap();
  }

  static create(resourcePath = "") {
    return new AvatarLoader({
      createDependencies: () =>
        initializeDefaultAvatarDependencies(resourcePath),
      getAssetBundle: async (library) => {
        return new LegacyAssetBundle(`${resourcePath}/figure/${library}`);
      },
      getEffectMap: async () => {
        const response = await fetch(`${resourcePath}/effectmap.xml`);
        const text = await response.text();

        return new AvatarEffectMap(text);
      },
      getEffectBundle: async (effect) => {
        const data = await ShroomAssetBundle.fromUrl(
          `${resourcePath}/effects/${effect.lib}.shroom`
        );
        return new AvatarEffectBundle(data);
      },
    });
  }

  static createForAssetBundle(resourcePath = "") {
    return new AvatarLoader({
      createDependencies: () =>
        initializeDefaultAvatarDependencies(resourcePath),
      getAssetBundle: async (library) => {
        return ShroomAssetBundle.fromUrl(
          `${resourcePath}/figure/${library}.shroom`
        );
      },
      getEffectMap: async () => {
        const response = await fetch(`${resourcePath}/effectmap.xml`);
        const text = await response.text();

        return new AvatarEffectMap(text);
      },
      getEffectBundle: async (effect) => {
        const data = await ShroomAssetBundle.fromUrl(
          `${resourcePath}/effects/${effect.lib}.shroom`
        );
        return new AvatarEffectBundle(data);
      },
    });
  }

  async getAvatarDrawDefinition(
    options: LookOptions
  ): Promise<AvatarLoaderResult> {
    const getDrawDefinition = await this._lookServer;

    return this._getAvatarDrawDefinition(getDrawDefinition, options);
  }

  async _getAvatarDrawDefinition(
    getDrawDefinition: LookServer,
    options: LookOptions
  ): Promise<AvatarLoaderResult> {
    const { actions, look, item, effect, initial, skipCaching } = options;

    const effectMap = await this._effectMap;

    const loadedFiles = new Map<string, Promise<HitTexture>>();

    let effectData: IAvatarEffectData | undefined;
    let effectBundle: IAvatarEffectBundle | undefined;

    if (effect != null) {
      const effectInfo = effectMap.getEffectInfo(effect);

      if (effectInfo != null) {
        effectBundle = await this._options.getEffectBundle(effectInfo);
        effectData = await effectBundle.getData();
      }
    }

    const { figureData, figureMap } = await this._dependencies;

    const libs = getLibrariesForLook(parseLookString(options.look), {
      figureData: figureData,
      figureMap: figureMap,
    });

    if (effectBundle != null) {
      await this._offsets.open(effectBundle);
    }

    await Promise.all(
      Array.from(libs).map((lib) =>
        this._getAssetBundle(lib).then((bundle) => this._offsets.open(bundle))
      )
    );

    const fileIds = getDrawDefinition(options, effectData)
      ?.parts.flatMap((part) => part.assets)
      .map((asset) => asset.fileId);

    if (fileIds != null) {
      await this._offsets.loadTextures(fileIds);
    }

    const obj: AvatarLoaderResult = {
      getDrawDefinition: (options) => {
        const result = this._getDrawDefinitionCached(
          getDrawDefinition,
          options,
          effectData
        );
        if (result == null) throw new Error("Invalid look");

        return result;
      },
      getTexture: (id) => {
        const texture = this._offsets.getTexture(id);

        if (texture == null) {
          console.error("Texture not found in", this._offsets);
          throw new Error(`Invalid texture: ${id}`);
        }

        return texture;
      },
    };

    return obj;
  }

  private async _getAssetBundle(library: string) {
    const current = this._assetBundles.get(library);
    if (current != null) return current;

    const bundle = this._options
      .getAssetBundle(library)
      .then((bundle) => new ManifestLibrary(bundle));
    this._assetBundles.set(library, bundle);

    return bundle;
  }

  private _loadEffect(type: string, id: string) {
    const key = `${type}_${id}`;
    let current = this._effectCache.get(key);

    if (current == null) {
      current = ShroomAssetBundle.fromUrl(
        `./resources/figure/hh_human_fx.shroom`
      ).then(async (bundle) => {
        const xml = await bundle.getString(`${type}${id}.bin`);

        return new AvatarEffectData(xml);
      });

      this._effectCache.set(key, current);
    }

    return current;
  }

  private _getDrawDefinitionCached(
    getAvatarDrawDefinition: LookServer,
    lookOptions: LookOptions,
    effect: IAvatarEffectData | undefined
  ) {
    const key = _getLookOptionsString(lookOptions);

    const existing = this._lookOptionsCache.get(key);

    if (existing != null) {
      return existing;
    }

    const drawDefinition = getAvatarDrawDefinition(lookOptions, effect);
    if (drawDefinition == null) return;

    this._lookOptionsCache.set(key, drawDefinition);

    return drawDefinition;
  }
}

async function initializeDefaultAvatarDependencies(
  resourcePath: string
): Promise<AvatarDependencies> {
  const {
    animationData,
    offsetsData,
    figureMap,
    figureData,
    partSetsData,
    actionsData,
    geometry,
  } = await Bluebird.props({
    animationData: AvatarAnimationData.default(),
    figureData: FigureData.fromUrl(`${resourcePath}/figuredata.xml`),
    figureMap: FigureMapData.fromUrl(`${resourcePath}/figuremap.xml`),
    offsetsData: AvatarOffsetsData.fromUrl(`${resourcePath}/offsets.json`),
    partSetsData: AvatarPartSetsData.default(),
    actionsData: AvatarActionsData.default(),
    geometry: AvatarGeometryData.default(),
  });

  return {
    animationData,
    figureData,
    offsetsData,
    figureMap,
    partSetsData,
    actionsData,
    geometry,
  };
}
