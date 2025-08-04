import { Particle } from '../Particle';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Rotation behavior that handles starting rotation, rotation speed, and rotational acceleration.
 *
 * Example configuration:
 * ```javascript
 * {
 *     "type": "rotation",
 *     "config": {
 *          "minStart": 0,
 *          "maxStart": 180,
 *          "minSpeed": 30,
 *          "maxSpeed": 45,
 *          "accel": 20
 *     }
 *}
 * ```
 */
export declare class RotationBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private minStart;
    private maxStart;
    private minSpeed;
    private maxSpeed;
    private accel;
    constructor(config: {
        /**
         * Minimum starting rotation of the particles, in degrees. 0 is facing right, 90 is upwards.
         */
        minStart: number;
        /**
         * Maximum starting rotation of the particles, in degrees. 0 is facing right, 90 is upwards.
         */
        maxStart: number;
        /**
         * Minimum rotation speed of the particles, in degrees/second. Positive is counter-clockwise.
         */
        minSpeed: number;
        /**
         * Maximum rotation speed of the particles, in degrees/second. Positive is counter-clockwise.
         */
        maxSpeed: number;
        /**
         * Constant rotational acceleration of the particles, in degrees/second/second.
         */
        accel: number;
    });
    initParticles(first: Particle): void;
    updateParticle(particle: Particle, deltaSec: number): void;
}
/**
 * A Rotation behavior that handles starting rotation.
 *
 * Example configuration:
 * ```javascript
 * {
 *     "type": "rotationStatic",
 *     "config": {
 *          "min": 0,
 *          "max": 180,
 *     }
 *}
 * ```
 */
export declare class StaticRotationBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private min;
    private max;
    constructor(config: {
        /**
         * Minimum starting rotation of the particles, in degrees. 0 is facing right, 90 is upwards.
         */
        min: number;
        /**
         * Maximum starting rotation of the particles, in degrees. 0 is facing right, 90 is upwards.
         */
        max: number;
    });
    initParticles(first: Particle): void;
}
/**
 * A Rotation behavior that blocks all rotation caused by spawn settings,
 * by resetting it to the specified rotation (or 0).
 *
 * Example configuration:
 * ```javascript
 * {
 *     "type": "noRotation",
 *     "config": {
 *          "rotation": 0
 *     }
 *}
 * ```
 */
export declare class NoRotationBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: number;
    private rotation;
    constructor(config: {
        /**
         * Locked rotation of the particles, in degrees. 0 is facing right, 90 is upwards.
         */
        rotation?: number;
    });
    initParticles(first: Particle): void;
}
