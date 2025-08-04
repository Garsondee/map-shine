import { Particle } from '../Particle';
import { ValueList } from '../PropertyNode';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Scale behavior that applies an interpolated or stepped list of values to the particle's x & y scale.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'scale',
 *     config: {
 *          scale: {
 *              list: [{value: 0, time: 0}, {value: 1, time: 0.25}, {value: 0, time: 1}],
 *              isStepped: true
 *          },
 *          minMult: 0.5
 *     }
 * }
 * ```
 */
export declare class ScaleBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private list;
    private minMult;
    constructor(config: {
        /**
         * Scale of the particles, with a minimum value of 0
         */
        scale: ValueList<number>;
        /**
         * A value between minimum scale multipler and 1 is randomly
         * generated and multiplied with each scale value to provide the actual scale for each particle.
         */
        minMult: number;
    });
    initParticles(first: Particle): void;
    updateParticle(particle: Particle): void;
}
/**
 * A Scale behavior that applies a randomly picked value to the particle's x & y scale at initialization.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'scaleStatic',
 *     config: {
 *         min: 0.25,
 *         max: 0.75,
 *     }
 * }
 * ```
 */
export declare class StaticScaleBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private min;
    private max;
    constructor(config: {
        /**
         * Minimum scale of the particles, with a minimum value of 0
         */
        min: number;
        /**
         * Maximum scale of the particles, with a minimum value of 0
         */
        max: number;
    });
    initParticles(first: Particle): void;
}
