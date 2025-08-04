import { Particle } from '../Particle';
import { ValueList } from '../PropertyNode';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A particle that follows a path defined by an algebraic expression, e.g. "sin(x)" or
 * "5x + 3".
 * To use this class, the behavior config must have a "path" string or function.
 *
 * A string should have "x" in it to represent movement (from the
 * speed settings of the behavior). It may have numbers, parentheses, the four basic
 * operations, and any Math functions or properties (without the preceding "Math.").
 * The overall movement of the particle and the expression value become x and y positions for
 * the particle, respectively. The final position is rotated by the spawn rotation/angle of
 * the particle.
 *
 * A function merely needs to accept the "x" argument and output the a corresponding "y" value.
 *
 * Some example paths:
 *
 * * `"sin(x/10) * 20"` A sine wave path.
 * * `"cos(x/100) * 30"` Particles curve counterclockwise (for medium speed/low lifetime particles)
 * * `"pow(x/10, 2) / 2"` Particles curve clockwise (remember, +y is down).
 * * `(x) => Math.floor(x) * 3` Supplying an existing function should look like this
 *
 * Example configuration:
 * ```javascript
 * {
 *     "type": "movePath",
 *     "config": {
 *          "path": "round(sin(x) * 2",
 *          "speed": {
 *              "list": [{value: 10, time: 0}, {value: 100, time: 0.25}, {value: 0, time: 1}],
 *          },
 *          "minMult": 0.8
 *     }
 *}
 */
export declare class PathBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    /**
     * The function representing the path the particle should take.
     */
    private path;
    private list;
    private minMult;
    constructor(config: {
        /**
         * Algebraic expression describing the movement of the particle.
         */
        path: string | ((x: number) => number);
        /**
         * Speed of the particles in world units/second. This affects the x value in the path.
         * Unlike normal speed movement, this can have negative values.
         */
        speed: ValueList<number>;
        /**
         * A value between minimum speed multipler and 1 is randomly generated and multiplied
         * with each speed value to generate the actual speed for each particle.
         */
        minMult: number;
    });
    initParticles(first: Particle): void;
    updateParticle(particle: Particle, deltaSec: number): void;
}
