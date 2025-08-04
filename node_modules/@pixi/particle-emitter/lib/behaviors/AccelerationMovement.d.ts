import { Particle } from '../Particle';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Movement behavior that handles movement by applying a constant acceleration to all particles.
 *
 * Example configuration:
 * ```javascript
 * {
 *     "type": "moveAcceleration",
 *     "config": {
 *          "accel": {
 *               "x": 0,
 *               "y": 2000
 *          },
 *          "minStart": 600,
 *          "maxStart": 600,
 *          "rotate": true
 *     }
 *}
 * ```
 */
export declare class AccelerationBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private minStart;
    private maxStart;
    private accel;
    private rotate;
    private maxSpeed;
    constructor(config: {
        /**
         * Minimum speed when initializing the particle, in world units/second.
         */
        minStart: number;
        /**
         * Maximum speed when initializing the particle. in world units/second.
         */
        maxStart: number;
        /**
         * Constant acceleration, in the coordinate space of the particle parent, in world units/second.
         */
        accel: {
            x: number;
            y: number;
        };
        /**
         * Rotate the particle with its direction of movement.
         * While initial movement direction reacts to rotation settings, this overrides any dynamic rotation.
         * Defaults to false.
         */
        rotate?: boolean;
        /**
         * Maximum linear speed. 0 is unlimited. Defaults to 0.
         */
        maxSpeed?: number;
    });
    initParticles(first: Particle): void;
    updateParticle(particle: Particle, deltaSec: number): void;
}
