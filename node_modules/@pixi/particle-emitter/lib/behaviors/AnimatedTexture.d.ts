import { Texture } from '@pixi/core';
import { Particle } from '../Particle';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * The format of a single animation to be used on a particle.
 */
export interface AnimatedParticleArt {
    /**
     * Framerate for the animation (in frames per second). A value of -1 will tie the framerate to
     * the particle's lifetime so that the animation lasts exactly as long as the particle.
     */
    framerate: -1 | number;
    /**
     * If the animation should loop. Defaults to false.
     */
    loop?: boolean;
    /**
     * A list of textures or frame descriptions for duplicated frames.
     * String values will be converted to textures with {@link ParticleUtils.GetTextureFromString}.
     * Example of a texture repeated for 5 frames, followed by a second texture for one frame:
     * ```javascript
     * [{texture: 'myFirstTex', count: 5}, 'mySecondTex']
     * ```
     */
    textures: (string | Texture | {
        texture: string | Texture;
        count: number;
    })[];
}
/**
 * Internal data format for playback.
 */
export interface ParsedAnimatedParticleArt {
    textures: Texture[];
    duration: number;
    framerate: number;
    loop: boolean;
}
/**
 * A Texture behavior that picks a random animation for each particle to play.
 * See {@link AnimatedParticleArt} for detailed configuration info.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'animatedRandom',
 *     config: {
 *         anims: [
 *              {
 *                  framerate: 25,
 *                  loop: true,
 *                  textures: ['frame1', 'frame2', 'frame3']
 *              },
 *              {
 *                  framerate: 25,
 *                  loop: true,
 *                  textures: ['frame3', 'frame2', 'frame1']
 *              }
 *         ],
 *     }
 * }
 * ```
 */
export declare class RandomAnimatedTextureBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private anims;
    constructor(config: {
        /**
         * Animation configuration to use for each particle, randomly chosen from the list.
         */
        anims: AnimatedParticleArt[];
    });
    initParticles(first: Particle): void;
    updateParticle(particle: Particle, deltaSec: number): void;
}
/**
 * A Texture behavior that uses a single animation for each particle to play.
 * See {@link AnimatedParticleArt} for detailed configuration info.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'animatedSingle',
 *     config: {
 *         anim: {
 *              framerate: 25,
 *              loop: true,
 *              textures: ['frame1', 'frame2', 'frame3']
 *         }
 *     }
 * }
 * ```
 */
export declare class SingleAnimatedTextureBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private anim;
    constructor(config: {
        /**
         * Animation configuration to use for each particle.
         */
        anim: AnimatedParticleArt;
    });
    initParticles(first: Particle): void;
    updateParticle(particle: Particle, deltaSec: number): void;
}
