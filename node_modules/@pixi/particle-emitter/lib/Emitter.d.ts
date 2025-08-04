import { SimpleEase } from './ParticleUtils';
import { Particle } from './Particle';
import { EmitterConfigV3 } from './EmitterConfig';
import { Container } from '@pixi/display';
import { Point } from '@pixi/math';
import { IEmitterBehavior, IEmitterBehaviorClass } from './behaviors/Behaviors';
/**
 * Key used in sorted order to determine when to set particle position from the emitter position
 * and rotation.
 */
declare const PositionParticle: unique symbol;
/**
 * A particle emitter.
 */
export declare class Emitter {
    private static knownBehaviors;
    /**
     * Registers a new behavior, so that it will be recognized when initializing emitters.
     * Behaviors registered later with duplicate types will override older ones, although there is no limit on
     * the allowed types.
     * @param constructor The behavior class to register.
     */
    static registerBehavior(constructor: IEmitterBehaviorClass): void;
    /**
     * Active initialization behaviors for this emitter.
     */
    protected initBehaviors: (IEmitterBehavior | typeof PositionParticle)[];
    /**
     * Active update behaviors for this emitter.
     */
    protected updateBehaviors: IEmitterBehavior[];
    /**
     * Active recycle behaviors for this emitter.
     */
    protected recycleBehaviors: IEmitterBehavior[];
    /**
     * The minimum lifetime for a particle, in seconds.
     */
    minLifetime: number;
    /**
     * The maximum lifetime for a particle, in seconds.
     */
    maxLifetime: number;
    /**
     * An easing function for nonlinear interpolation of values. Accepts a single
     * parameter of time as a value from 0-1, inclusive. Expected outputs are values
     * from 0-1, inclusive.
     */
    customEase: SimpleEase;
    /**
     * Time between particle spawns in seconds.
     */
    protected _frequency: number;
    /**
     * Chance that a particle will be spawned on each opportunity to spawn one.
     * 0 is 0%, 1 is 100%.
     */
    spawnChance: number;
    /**
     * Maximum number of particles to keep alive at a time. If this limit
     * is reached, no more particles will spawn until some have died.
     */
    maxParticles: number;
    /**
     * The amount of time in seconds to emit for before setting emit to false.
     * A value of -1 is an unlimited amount of time.
     */
    emitterLifetime: number;
    /**
     * Position at which to spawn particles, relative to the emitter's owner's origin.
     * For example, the flames of a rocket travelling right might have a spawnPos
     * of {x:-50, y:0}.
     * to spawn at the rear of the rocket.
     * To change this, use updateSpawnPos().
     */
    spawnPos: Point;
    /**
     * Number of particles to spawn time that the frequency allows for particles to spawn.
     */
    particlesPerWave: number;
    /**
     * Rotation of the emitter or emitter's owner in degrees. This is added to
     * the calculated spawn angle.
     * To change this, use rotate().
     */
    protected rotation: number;
    /**
     * The world position of the emitter's owner, to add spawnPos to when
     * spawning particles. To change this, use updateOwnerPos().
     */
    protected ownerPos: Point;
    /**
     * The origin + spawnPos in the previous update, so that the spawn position
     * can be interpolated to space out particles better.
     */
    protected _prevEmitterPos: Point;
    /**
     * If _prevEmitterPos is valid, to prevent interpolation on the first update
     */
    protected _prevPosIsValid: boolean;
    /**
     * If either ownerPos or spawnPos has changed since the previous update.
     */
    protected _posChanged: boolean;
    /**
     * The container to add particles to.
     */
    protected _parent: Container;
    /**
     * If particles should be added at the back of the display list instead of the front.
     */
    addAtBack: boolean;
    /**
     * The current number of active particles.
     */
    particleCount: number;
    /**
     * If particles should be emitted during update() calls. Setting this to false
     * stops new particles from being created, but allows existing ones to die out.
     */
    protected _emit: boolean;
    /**
     * The timer for when to spawn particles in seconds, where numbers less
     * than 0 mean that particles should be spawned.
     */
    protected _spawnTimer: number;
    /**
     * The life of the emitter in seconds.
     */
    protected _emitterLife: number;
    /**
     * The particles that are active and on the display list. This is the first particle in a
     * linked list.
     */
    protected _activeParticlesFirst: Particle;
    /**
     * The particles that are active and on the display list. This is the last particle in a
     * linked list.
     */
    protected _activeParticlesLast: Particle;
    /**
     * The particles that are not currently being used. This is the first particle in a
     * linked list.
     */
    protected _poolFirst: Particle;
    /**
     * The original config object that this emitter was initialized with.
     */
    protected _origConfig: any;
    /**
     * If the update function is called automatically from the shared ticker.
     * Setting this to false requires calling the update function manually.
     */
    protected _autoUpdate: boolean;
    /**
     * If the emitter should destroy itself when all particles have died out. This is set by
     * playOnceAndDestroy();
     */
    protected _destroyWhenComplete: boolean;
    /**
     * A callback for when all particles have died out. This is set by
     * playOnceAndDestroy() or playOnce();
     */
    protected _completeCallback: () => void;
    /**
     * @param particleParent The container to add the particles to.
     * @param particleImages A texture or array of textures to use
     *                       for the particles. Strings will be turned
     *                       into textures via Texture.from().
     * @param config A configuration object containing settings for the emitter.
     * @param config.emit If config.emit is explicitly passed as false, the
     *                    Emitter will start disabled.
     * @param config.autoUpdate If config.autoUpdate is explicitly passed as
     *                          true, the Emitter will automatically call
     *                          update via the PIXI shared ticker.
     */
    constructor(particleParent: Container, config: EmitterConfigV3);
    /**
     * Time between particle spawns in seconds. If this value is not a number greater than 0,
     * it will be set to 1 (particle per second) to prevent infinite loops.
     */
    get frequency(): number;
    set frequency(value: number);
    /**
    * The container to add particles to. Settings this will dump any active particles.
    */
    get parent(): Container;
    set parent(value: Container);
    /**
     * Sets up the emitter based on the config settings.
     * @param config A configuration object containing settings for the emitter.
     */
    init(config: EmitterConfigV3): void;
    /**
     * Gets the instantiated behavior of the specified type, if it is present on this emitter.
     * @param type The behavior type to find.
     */
    getBehavior(type: string): IEmitterBehavior | null;
    /**
     * Fills the pool with the specified number of particles, so that they don't have to be instantiated later.
     * @param count The number of particles to create.
     */
    fillPool(count: number): void;
    /**
     * Recycles an individual particle. For internal use only.
     * @param particle The particle to recycle.
     * @param fromCleanup If this is being called to manually clean up all particles.
     * @internal
     */
    recycle(particle: Particle, fromCleanup?: boolean): void;
    /**
     * Sets the rotation of the emitter to a new value. This rotates the spawn position in addition
     * to particle direction.
     * @param newRot The new rotation, in degrees.
     */
    rotate(newRot: number): void;
    /**
     * Changes the spawn position of the emitter.
     * @param x The new x value of the spawn position for the emitter.
     * @param y The new y value of the spawn position for the emitter.
     */
    updateSpawnPos(x: number, y: number): void;
    /**
     * Changes the position of the emitter's owner. You should call this if you are adding
     * particles to the world container that your emitter's owner is moving around in.
     * @param x The new x value of the emitter's owner.
     * @param y The new y value of the emitter's owner.
     */
    updateOwnerPos(x: number, y: number): void;
    /**
     * Prevents emitter position interpolation in the next update.
     * This should be used if you made a major position change of your emitter's owner
     * that was not normal movement.
     */
    resetPositionTracking(): void;
    /**
     * If particles should be emitted during update() calls. Setting this to false
     * stops new particles from being created, but allows existing ones to die out.
     */
    get emit(): boolean;
    set emit(value: boolean);
    /**
     * If the update function is called automatically from the shared ticker.
     * Setting this to false requires calling the update function manually.
     */
    get autoUpdate(): boolean;
    set autoUpdate(value: boolean);
    /**
     * Starts emitting particles, sets autoUpdate to true, and sets up the Emitter to destroy itself
     * when particle emission is complete.
     * @param callback Callback for when emission is complete (all particles have died off)
     */
    playOnceAndDestroy(callback?: () => void): void;
    /**
     * Starts emitting particles and optionally calls a callback when particle emission is complete.
     * @param callback Callback for when emission is complete (all particles have died off)
     */
    playOnce(callback?: () => void): void;
    /**
     * Updates all particles spawned by this emitter and emits new ones.
     * @param delta Time elapsed since the previous frame, in __seconds__.
     */
    update(delta: number): void;
    /**
     * Emits a single wave of particles, using standard spawnChance & particlesPerWave settings. Does not affect
     * regular spawning through the frequency, and ignores the emit property. The max particle count is respected, however,
     * so if there are already too many particles then nothing will happen.
     */
    emitNow(): void;
    /**
     * Kills all active particles immediately.
     */
    cleanup(): void;
    /**
     * If this emitter has been destroyed. Note that a destroyed emitter can still be reused, after
     * having a new parent set and being reinitialized.
     */
    get destroyed(): boolean;
    /**
     * Destroys the emitter and all of its particles.
     */
    destroy(): void;
}
export {};
