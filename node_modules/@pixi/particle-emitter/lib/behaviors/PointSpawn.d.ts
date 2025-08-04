import { Particle } from '../Particle';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Spawn behavior that sends particles out from a single point at the emitter's position.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'spawnPoint',
 *     config: {}
 * }
 * ```
 */
export declare class PointSpawnBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    initParticles(_first: Particle): void;
}
