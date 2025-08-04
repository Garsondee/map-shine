import { Texture } from '@pixi/core';
import { Particle } from '../Particle';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Texture behavior that assigns a random texture to each particle from its list.
 * String values will be converted to textures with {@link ParticleUtils.GetTextureFromString}.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'textureRandom',
 *     config: {
 *         textures: ["myTex1Id", "myTex2Id", "myTex3Id", "myTex4Id"],
 *     }
 * }
 * ```
 */
export declare class RandomTextureBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private textures;
    constructor(config: {
        /**
         * Images to use for each particle, randomly chosen from the list.
         */
        textures: (Texture | string)[];
    });
    initParticles(first: Particle): void;
}
