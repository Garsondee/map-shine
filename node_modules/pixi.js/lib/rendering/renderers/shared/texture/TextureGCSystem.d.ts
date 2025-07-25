import { ExtensionType } from '../../../../extensions/Extensions';
import type { Renderer } from '../../types';
import type { System } from '../system/System';
/**
 * Options for the {@link TextureGCSystem}.
 * @category rendering
 * @advanced
 */
export interface TextureGCSystemOptions {
    /**
     * If set to true, this will enable the garbage collector on the GPU.
     * @default true
     */
    textureGCActive: boolean;
    /**
     * @deprecated since 8.3.0
     * @see {@link TextureGCSystemOptions.textureGCMaxIdle}
     */
    textureGCAMaxIdle: number;
    /**
     * The maximum idle frames before a texture is destroyed by garbage collection.
     * @default 60 * 60
     */
    textureGCMaxIdle: number;
    /**
     * Frames between two garbage collections.
     * @default 600
     */
    textureGCCheckCountMax: number;
}
/**
 * System plugin to the renderer to manage texture garbage collection on the GPU,
 * ensuring that it does not get clogged up with textures that are no longer being used.
 * @category rendering
 * @advanced
 */
export declare class TextureGCSystem implements System<TextureGCSystemOptions> {
    /** @ignore */
    static extension: {
        readonly type: readonly [ExtensionType.WebGLSystem, ExtensionType.WebGPUSystem];
        readonly name: "textureGC";
    };
    /** default options for the TextureGCSystem */
    static defaultOptions: TextureGCSystemOptions;
    /**
     * Frame count since started.
     * @readonly
     */
    count: number;
    /**
     * Frame count since last garbage collection.
     * @readonly
     */
    checkCount: number;
    /**
     * Maximum idle frames before a texture is destroyed by garbage collection.
     * @see TextureGCSystem.defaultMaxIdle
     */
    maxIdle: number;
    /**
     * Frames between two garbage collections.
     * @see TextureGCSystem.defaultCheckCountMax
     */
    checkCountMax: number;
    /**
     * Current garbage collection mode.
     * @see TextureGCSystem.defaultMode
     */
    active: boolean;
    private _renderer;
    /** @param renderer - The renderer this System works for. */
    constructor(renderer: Renderer);
    init(options: TextureGCSystemOptions): void;
    /**
     * Checks to see when the last time a texture was used.
     * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
     */
    protected postrender(): void;
    /**
     * Checks to see when the last time a texture was used.
     * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
     */
    run(): void;
    destroy(): void;
}
