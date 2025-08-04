import { Particle } from '../Particle';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Blend Mode behavior that applies a blend mode value to the particle at initialization.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'blendMode',
 *     config: {
 *         blendMode: 'multiply',
 *     }
 * }
 * ```
 */
export declare class BlendModeBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private value;
    constructor(config: {
        /**
         * Blend mode of all particles. This value is a key from
         * [PixiJs's BLEND_MODE enum](https://pixijs.download/release/docs/PIXI.html#BLEND_MODES).
         */
        blendMode: string;
    });
    initParticles(first: Particle): void;
}
