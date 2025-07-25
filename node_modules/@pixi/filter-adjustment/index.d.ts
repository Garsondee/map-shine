import type { CLEAR_MODES } from '@pixi/constants';
import { Filter } from '@pixi/core';
import type { FilterSystem } from '@pixi/core';
import type { RenderTexture } from '@pixi/core';

/**
 * The ability to adjust gamma, contrast, saturation, brightness, alpha or color-channel shift.
 * This is a faster and much simpler to use than
 * {@link http://pixijs.download/release/docs/PIXI.filters.ColorMatrixFilter.html ColorMatrixFilter}
 * because it does not use a matrix.<br>
 * ![original](../tools/screenshots/dist/original.png)![filter](../tools/screenshots/dist/adjustment.png)
 *
 * @class
 * @extends PIXI.Filter
 * @memberof PIXI.filters
 * @see {@link https://www.npmjs.com/package/@pixi/filter-adjustment|@pixi/filter-adjustment}
 * @see {@link https://www.npmjs.com/package/pixi-filters|pixi-filters}
 */
export declare class AdjustmentFilter extends Filter {
    /** The amount of luminance */
    gamma: number;
    /** The amount of saturation */
    saturation: number;
    /** The amount of contrast */
    contrast: number;
    /** The amount of brightness */
    brightness: number;
    /** The amount of red channel */
    red: number;
    /** The amount of green channel */
    green: number;
    /** The amount of blue channel */
    blue: number;
    /** The amount of alpha channel */
    alpha: number;
    /**
     * @param {object|number} [options] - The optional parameters of the filter.
     * @param {number} [options.gamma=1] - The amount of luminance
     * @param {number} [options.saturation=1] - The amount of color saturation
     * @param {number} [options.contrast=1] - The amount of contrast
     * @param {number} [options.brightness=1] - The overall brightness
     * @param {number} [options.red=1] - The multipled red channel
     * @param {number} [options.green=1] - The multipled green channel
     * @param {number} [options.blue=1] - The multipled blue channel
     * @param {number} [options.alpha=1] - The overall alpha amount
     */
    constructor(options?: Partial<AdjustmentFilterOptions>);
    /**
     * Override existing apply method in PIXI.Filter
     * @ignore
     */
    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clear: CLEAR_MODES): void;
}

export declare interface AdjustmentFilterOptions {
    gamma: number;
    saturation: number;
    contrast: number;
    brightness: number;
    red: number;
    green: number;
    blue: number;
    alpha: number;
}

export { }
