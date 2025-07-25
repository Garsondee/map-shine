import { TextureSource } from './sources/TextureSource';
import { Texture } from './Texture';
import { TextureStyle } from './TextureStyle';
import type { TextureSourceOptions } from './sources/TextureSource';
/**
 * Texture pool, used by FilterSystem and plugins.
 *
 * Stores collection of temporary pow2 or screen-sized renderTextures
 *
 * If you use custom RenderTexturePool for your filters, you can use methods
 * `getFilterTexture` and `returnFilterTexture` same as in default pool
 * @category rendering
 * @advanced
 */
export declare class TexturePoolClass {
    /** The default options for texture pool */
    textureOptions: TextureSourceOptions;
    /** The default texture style for the pool */
    textureStyle: TextureStyle;
    /**
     * Allow renderTextures of the same size as screen, not just pow2
     *
     * Automatically sets to true after `setScreenSize`
     * @default false
     */
    enableFullScreen: boolean;
    private _texturePool;
    private _poolKeyHash;
    /**
     * @param textureOptions - options that will be passed to BaseRenderTexture constructor
     * @param {SCALE_MODE} [textureOptions.scaleMode] - See {@link SCALE_MODE} for possible values.
     */
    constructor(textureOptions?: TextureSourceOptions);
    /**
     * Creates texture with params that were specified in pool constructor.
     * @param pixelWidth - Width of texture in pixels.
     * @param pixelHeight - Height of texture in pixels.
     * @param antialias
     */
    createTexture(pixelWidth: number, pixelHeight: number, antialias: boolean): Texture;
    /**
     * Gets a Power-of-Two render texture or fullScreen texture
     * @param frameWidth - The minimum width of the render texture.
     * @param frameHeight - The minimum height of the render texture.
     * @param resolution - The resolution of the render texture.
     * @param antialias
     * @returns The new render texture.
     */
    getOptimalTexture(frameWidth: number, frameHeight: number, resolution: number, antialias: boolean): Texture;
    /**
     * Gets extra texture of the same size as input renderTexture
     * @param texture - The texture to check what size it is.
     * @param antialias - Whether to use antialias.
     * @returns A texture that is a power of two
     */
    getSameSizeTexture(texture: Texture, antialias?: boolean): Texture<TextureSource<any>>;
    /**
     * Place a render texture back into the pool. Optionally reset the style of the texture to the default texture style.
     * useful if you modified the style of the texture after getting it from the pool.
     * @param renderTexture - The renderTexture to free
     * @param resetStyle - Whether to reset the style of the texture to the default texture style
     */
    returnTexture(renderTexture: Texture, resetStyle?: boolean): void;
    /**
     * Clears the pool.
     * @param destroyTextures - Destroy all stored textures.
     */
    clear(destroyTextures?: boolean): void;
}
/**
 * The default texture pool instance.
 * @category rendering
 * @advanced
 */
export declare const TexturePool: TexturePoolClass;
