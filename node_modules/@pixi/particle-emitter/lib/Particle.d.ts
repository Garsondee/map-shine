import { Emitter } from './Emitter';
import { LinkedListChild } from './LinkedListContainer';
import { Sprite } from '@pixi/sprite';
/**
 * An individual particle image. You shouldn't have to deal with these.
 */
export declare class Particle extends Sprite implements LinkedListChild {
    /**
     * The emitter that controls this particle.
     */
    emitter: Emitter;
    /**
     * The maximum lifetime of this particle, in seconds.
     */
    maxLife: number;
    /**
     * The current age of the particle, in seconds.
     */
    age: number;
    /**
     * The current age of the particle as a normalized value between 0 and 1.
     */
    agePercent: number;
    /**
     * One divided by the max life of the particle, saved for slightly faster math.
     */
    oneOverLife: number;
    /**
     * Reference to the next particle in the list.
     */
    next: Particle;
    /**
     * Reference to the previous particle in the list.
     */
    prev: Particle;
    prevChild: LinkedListChild;
    nextChild: LinkedListChild;
    /**
     * Static per-particle configuration for behaviors to use. Is not cleared when recycling.
     */
    config: {
        [key: string]: any;
    };
    /**
     * @param emitter The emitter that controls this particle.
     */
    constructor(emitter: Emitter);
    /**
     * Initializes the particle for use, based on the properties that have to
     * have been set already on the particle.
     */
    init(maxLife: number): void;
    /**
     * Kills the particle, removing it from the display list
     * and telling the emitter to recycle it.
     */
    kill(): void;
    /**
     * Destroys the particle, removing references and preventing future use.
     */
    destroy(): void;
}
