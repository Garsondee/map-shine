import { Particle } from '../Particle';
import { ValueList } from '../PropertyNode';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * An Alpha behavior that applies an interpolated or stepped list of values to the particle's opacity.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'alpha',
 *     config: {
 *         alpha: {
 *              list: [{value: 0, time: 0}, {value: 1, time: 0.25}, {value: 0, time: 1}]
 *         },
 *     }
 * }
 * ```
 */
export declare class AlphaBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private list;
    constructor(config: {
        /**
         * Transparency of the particles from 0 (transparent) to 1 (opaque)
         */
        alpha: ValueList<number>;
    });
    initParticles(first: Particle): void;
    updateParticle(particle: Particle): void;
}
/**
 * An Alpha behavior that applies a static value to the particle's opacity at particle initialization.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'alphaStatic',
 *     config: {
 *         alpha: 0.75,
 *     }
 * }
 * ```
 */
export declare class StaticAlphaBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private value;
    constructor(config: {
        /**
         * Transparency of the particles from 0 (transparent) to 1 (opaque)
         */
        alpha: number;
    });
    initParticles(first: Particle): void;
}
