import { Particle } from '../Particle';
import { ValueList } from '../PropertyNode';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Movement behavior that uses an interpolated or stepped list of values for a particles speed at any given moment.
 * Movement direction is controlled by the particle's starting rotation.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'moveSpeed',
 *     config: {
 *          speed: {
 *              list: [{value: 10, time: 0}, {value: 100, time: 0.25}, {value: 0, time: 1}],
 *          },
 *          minMult: 0.8
 *     }
 * }
 * ```
 */
export declare class SpeedBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private list;
    private minMult;
    constructor(config: {
        /**
         * Speed of the particles in world units/second, with a minimum value of 0
         */
        speed: ValueList<number>;
        /**
         * A value between minimum speed multipler and 1 is randomly
         * generated and multiplied with each speed value to generate the actual speed for each particle.
         */
        minMult: number;
    });
    initParticles(first: Particle): void;
    updateParticle(particle: Particle, deltaSec: number): void;
}
/**
 * A Movement behavior that uses a randomly picked constant speed throughout a particle's lifetime.
 * Movement direction is controlled by the particle's starting rotation.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'moveSpeedStatic',
 *     config: {
 *          min: 100,
 *          max: 150
 *     }
 * }
 * ```
 */
export declare class StaticSpeedBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private min;
    private max;
    constructor(config: {
        /**
         * Minimum speed when initializing the particle.
         */
        min: number;
        /**
         * Maximum speed when initializing the particle.
         */
        max: number;
    });
    initParticles(first: Particle): void;
    updateParticle(particle: Particle, deltaSec: number): void;
}
