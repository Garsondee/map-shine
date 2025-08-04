import { Particle } from '../Particle';
import { ValueList } from '../PropertyNode';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Color behavior that applies an interpolated or stepped list of values to the particle's tint property.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'color',
 *     config: {
 *         color: {
 *              list: [{value: '#ff0000' time: 0}, {value: '#00ff00', time: 0.5}, {value: '#0000ff', time: 1}]
 *         },
 *     }
 * }
 * ```
 */
export declare class ColorBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private list;
    constructor(config: {
        /**
         * Color of the particles as 6 digit hex codes.
         */
        color: ValueList<string>;
    });
    initParticles(first: Particle): void;
    updateParticle(particle: Particle): void;
}
/**
 * A Color behavior that applies a single color to the particle's tint property at initialization.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'colorStatic',
 *     config: {
 *         color: '#ffff00',
 *     }
 * }
 * ```
 */
export declare class StaticColorBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private value;
    constructor(config: {
        /**
         * Color of the particles as 6 digit hex codes.
         */
        color: string;
    });
    initParticles(first: Particle): void;
}
