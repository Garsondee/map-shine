import { Filter } from '@pixi/core';
import type { Point } from '@pixi/math';

declare type Offset = [number, number] | Point;

/**
 * An RGB Split Filter.<br>
 * ![original](../tools/screenshots/dist/original.png)![filter](../tools/screenshots/dist/rgb.png)
 *
 * @class
 * @extends PIXI.Filter
 * @memberof PIXI.filters
 * @see {@link https://www.npmjs.com/package/@pixi/filter-rgb-split|@pixi/filter-rgb-split}
 * @see {@link https://www.npmjs.com/package/pixi-filters|pixi-filters}
 */
export declare class RGBSplitFilter extends Filter {
    /**
     * @param {PIXI.Point | number[]} [red=[-10,0]] - Red channel offset
     * @param {PIXI.Point | number[]} [green=[0, 10]] - Green channel offset
     * @param {PIXI.Point | number[]} [blue=[0, 0]] - Blue channel offset
     */
    constructor(red?: Offset, green?: Offset, blue?: Offset);
    /**
     * Red channel offset.
     *
     * @member {PIXI.Point | number[]}
     */
    get red(): Offset;
    set red(value: Offset);
    /**
     * Green channel offset.
     *
     * @member {PIXI.Point | number[]}
     */
    get green(): Offset;
    set green(value: Offset);
    /**
     * Blue offset.
     *
     * @member {PIXI.Point | number[]}
     */
    get blue(): Offset;
    set blue(value: Offset);
}

export { }
