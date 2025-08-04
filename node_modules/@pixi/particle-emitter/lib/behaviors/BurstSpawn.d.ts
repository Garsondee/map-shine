import { Particle } from '../Particle';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Spawn behavior that sends particles out from a single point or ring, and is capable of evenly spacing
 * the particle's starting angles.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'spawnBurst',
 *     config: {
 *          spacing: 90,
 *          start: 0,
 *          distance: 40,
 *     }
 * }
 * ```
 */
export declare class BurstSpawnBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private spacing;
    private start;
    private distance;
    constructor(config: {
        /**
         * Description: Spacing between each particle spawned in a wave, in degrees.
         */
        spacing: number;
        /**
         * Description: Angle to start placing particles at, in degrees. 0 is facing right, 90 is facing upwards.
         */
        start: number;
        /**
         * Description: Distance from the emitter to spawn particles, forming a ring/arc.
         */
        distance: number;
    });
    initParticles(first: Particle): void;
}
