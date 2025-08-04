import { EaseSegment, SimpleEase } from './ParticleUtils';
import { ValueList } from './PropertyNode';
import { IPointData } from '@pixi/math';
/**
 * Full Emitter configuration for initializing an Emitter instance.
 */
export interface EmitterConfigV3 {
    /**
     * Random number configuration for picking the lifetime for each particle..
     */
    lifetime: RandNumber;
    /**
     * Easing to be applied to all interpolated or stepped values across the particle lifetime.
     */
    ease?: SimpleEase | EaseSegment[];
    /**
     * How many particles to spawn at once, each time that it is determined that particles should be spawned.
     * If omitted, only one particle will spawn at a time.
     */
    particlesPerWave?: number;
    /**
     * How often to spawn particles. This is a value in seconds, so a value of 0.5 would be twice a second.
     */
    frequency: number;
    /**
     * Defines a chance to not spawn particles. Values lower than 1 mean particles may not be spawned each time.
     * If omitted, particles will always spawn.
     */
    spawnChance?: number;
    /**
     * How long to run the Emitter before it stops spawning particles. If omitted, runs forever (or until told to stop
     * manually).
     */
    emitterLifetime?: number;
    /**
     * Maximum number of particles that can be alive at any given time for this emitter.
     */
    maxParticles?: number;
    /**
     * If newly spawned particles should be added to the back of the parent container (to make them less conspicuous
     * as they pop in). If omitted, particles will be added to the top of the container.
     */
    addAtBack?: boolean;
    /**
     * Default position to spawn particles from inside the parent container.
     */
    pos: {
        x: number;
        y: number;
    };
    /**
     * If the emitter should start out emitting particles. If omitted, it will be treated as `true` and will emit particles
     * immediately.
     */
    emit?: boolean;
    /**
     * If the Emitter should hook into PixiJS's shared ticker. If this is false or emitted, you will be responsible for
     * connecting it to update ticks.
     */
    autoUpdate?: boolean;
    /**
     * The list of behaviors to apply to this emitter. See the behaviors namespace for
     * a list of built in behaviors. Custom behaviors may be registered with {@link Emitter.registerBehavior}.
     */
    behaviors: BehaviorEntry[];
}
/**
 * See {@link EmitterConfigV3.behaviors}
 */
export interface BehaviorEntry {
    /**
     * The behavior type, as defined as the static `type` property of a behavior class.
     */
    type: string;
    /**
     * Configuration data specific to that behavior.
     */
    config: any;
}
/**
 * Configuration for how to pick a random number (inclusive).
 */
export interface RandNumber {
    /**
     * Maximum pickable value.
     */
    max: number;
    /**
     * Minimum pickable value.
     */
    min: number;
}
/**
 * Converts emitter configuration from pre-5.0.0 library values into the current version.
 *
 * Example usage:
 * ```javascript
 * const emitter = new Emitter(myContainer, upgradeConfig(myOldConfig, [myTexture, myOtherTexture]));
 * ```
 * @param config The old emitter config to upgrade.
 * @param art The old art values as would have been passed into the Emitter constructor or `Emitter.init()`
 */
export declare function upgradeConfig(config: EmitterConfigV2 | EmitterConfigV1, art: any): EmitterConfigV3;
/**
 * The obsolete emitter configuration format from version 3.0.0 of the library.
 * This type information is kept to make it easy to upgrade, but otherwise
 * configuration should be made as {@link EmitterConfigV3}.
 */
export interface EmitterConfigV2 {
    alpha?: ValueList<number>;
    speed?: ValueList<number>;
    minimumSpeedMultiplier?: number;
    maxSpeed?: number;
    acceleration?: {
        x: number;
        y: number;
    };
    scale?: ValueList<number>;
    minimumScaleMultiplier?: number;
    color?: ValueList<string>;
    startRotation?: RandNumber;
    noRotation?: boolean;
    rotationSpeed?: RandNumber;
    rotationAcceleration?: number;
    lifetime: RandNumber;
    blendMode?: string;
    ease?: SimpleEase | EaseSegment[];
    extraData?: any;
    particlesPerWave?: number;
    /**
     * Really "rect"|"circle"|"ring"|"burst"|"point"|"polygonalChain", but that
     * tends to be too strict for random object creation.
     */
    spawnType?: string;
    spawnRect?: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    spawnCircle?: {
        x: number;
        y: number;
        r: number;
        minR?: number;
    };
    particleSpacing?: number;
    angleStart?: number;
    spawnPolygon?: IPointData[] | IPointData[][];
    frequency: number;
    spawnChance?: number;
    emitterLifetime?: number;
    maxParticles?: number;
    addAtBack?: boolean;
    pos: {
        x: number;
        y: number;
    };
    emit?: boolean;
    autoUpdate?: boolean;
    orderedArt?: boolean;
}
export interface BasicTweenable<T> {
    start: T;
    end: T;
}
/**
 * The obsolete emitter configuration format of the initial library release.
 * This type information is kept to maintain compatibility with the older particle tool, but otherwise
 * configuration should be made as {@link EmitterConfigV3}.
 */
export interface EmitterConfigV1 {
    alpha?: BasicTweenable<number>;
    speed?: BasicTweenable<number> & {
        minimumSpeedMultiplier?: number;
    };
    maxSpeed?: number;
    acceleration?: {
        x: number;
        y: number;
    };
    scale?: BasicTweenable<number> & {
        minimumScaleMultiplier?: number;
    };
    color?: BasicTweenable<string>;
    startRotation?: RandNumber;
    noRotation?: boolean;
    rotationSpeed?: RandNumber;
    rotationAcceleration?: number;
    lifetime: RandNumber;
    blendMode?: string;
    ease?: SimpleEase | EaseSegment[];
    extraData?: any;
    particlesPerWave?: number;
    /**
     * Really "rect"|"circle"|"ring"|"burst"|"point"|"polygonalChain", but that
     * tends to be too strict for random object creation.
     */
    spawnType?: string;
    spawnRect?: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    spawnCircle?: {
        x: number;
        y: number;
        r: number;
        minR?: number;
    };
    particleSpacing?: number;
    angleStart?: number;
    spawnPolygon?: IPointData[] | IPointData[][];
    frequency: number;
    spawnChance?: number;
    emitterLifetime?: number;
    maxParticles?: number;
    addAtBack?: boolean;
    pos: {
        x: number;
        y: number;
    };
    emit?: boolean;
    autoUpdate?: boolean;
    orderedArt?: boolean;
}
