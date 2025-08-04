import { IPointData } from '@pixi/math';
import { ListProperty } from '../editor/Types';
import { SpawnShape } from './SpawnShape';
/**
 * Data structure for internal parsed data in PolygonalChain spawn shapes.
 */
export interface Segment {
    p1: IPointData;
    p2: IPointData;
    l: number;
}
/**
 * A spawn shape that picks a random position along a series of line segments. If those
 * line segments form a polygon, particles will only be placed on the perimeter of that polygon.
 *
 * Example config:
 * ```javascript
 * {
 *      type: 'polygonalChain',
 *      data: [
 *          [{x: 0, y: 0}, {x: 10, y: 10}, {x: 20, y: 0}],
 *          [{x: 0, y, -10}, {x: 10, y: 0}, {x: 20, y: -10}]
 *      ]
 * }
 * ```
 */
export declare class PolygonalChain implements SpawnShape {
    static type: string;
    static editorConfig: ListProperty;
    /**
     * List of segment objects in the chain.
     */
    private segments;
    /**
     * Total length of all segments of the chain.
     */
    private totalLength;
    /**
     * Total length of segments up to and including the segment of the same index.
     * Used for weighted random selection of segment.
     */
    private countingLengths;
    /**
     * @param data Point data for polygon chains. Either a list of points for a single chain, or a list of chains.
     */
    constructor(data: IPointData[] | IPointData[][]);
    /**
     * @param data Point data for polygon chains. Either a list of points for a single chain, or a list of chains.
     */
    private init;
    /**
     * Gets a random point in the chain.
     * @param out The point to store the selected position in.
     */
    getRandPos(out: IPointData): void;
}
