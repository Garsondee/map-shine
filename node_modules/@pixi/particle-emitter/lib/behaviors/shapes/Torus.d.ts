import { Particle } from '../../Particle';
import { ObjectProperty } from '../editor/Types';
import { SpawnShape } from './SpawnShape';
/**
 * A class for spawning particles in a circle or ring.
 * Can optionally apply rotation to particles so that they are aimed away from the center of the circle.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'torus',
 *     data: {
 *          radius: 30,
 *          x: 0,
 *          y: 0,
 *          innerRadius: 10,
 *          rotation: true
 *     }
 * }
 * ```
 */
export declare class Torus implements SpawnShape {
    static type: string;
    static editorConfig: ObjectProperty;
    /**
     * X position of the center of the shape.
     */
    x: number;
    /**
     * Y position of the center of the shape.
     */
    y: number;
    /**
     * Radius of circle, or outer radius of a ring.
     */
    radius: number;
    /**
     * Inner radius of a ring. Use 0 to have a circle.
     */
    innerRadius: number;
    /**
     * If rotation should be applied to particles.
     */
    rotation: boolean;
    constructor(config: {
        /**
         * Radius of circle, or outer radius of a ring. Note that this uses the full name of 'radius',
         * where earlier versions of the library may have used 'r'.
         */
        radius: number;
        /**
         * X position of the center of the shape.
         */
        x: number;
        /**
         * Y position of the center of the shape.
         */
        y: number;
        /**
         * Inner radius of a ring. Omit, or use 0, to have a circle.
         */
        innerRadius?: number;
        /**
         * If rotation should be applied to particles, pointing them away from the center of the torus.
         * Defaults to false.
         */
        affectRotation?: boolean;
    });
    getRandPos(particle: Particle): void;
}
