import { Particle } from '../Particle';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { SpawnShapeClass } from './shapes/SpawnShape';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Spawn behavior that places (and optionally rotates) particles according to a
 * specified shape. Additional shapes can be registered with {@link registerShape | SpawnShape.registerShape()}.
 * Additional shapes must implement the {@link SpawnShape} interface, and their class must match the
 * {@link SpawnShapeClass} interface.
 * Shapes included by default are:
 * * {@link Rectangle}
 * * {@link Torus}
 * * {@link PolygonalChain}
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'spawnShape',
 *     config: {
 *          type: 'rect',
 *          data: {
 *              x: 0,
 *              y: 0,
 *              width: 20,
 *              height: 300,
 *          }
 *     }
 * }
 * ```
 */
export declare class ShapeSpawnBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    /**
     * Dictionary of all registered shape classes.
     */
    private static shapes;
    /**
     * Registers a shape to be used by the ShapeSpawn behavior.
     * @param constructor The shape class constructor to use, with a static `type` property to reference it by.
     * @param typeOverride An optional type override, primarily for registering a shape under multiple names.
     */
    static registerShape(constructor: SpawnShapeClass, typeOverride?: string): void;
    order: BehaviorOrder;
    private shape;
    constructor(config: {
        /**
         * Type of the shape to spawn
         */
        type: string;
        /**
         * Configuration data for the spawn shape.
         */
        data: any;
    });
    initParticles(first: Particle): void;
}
