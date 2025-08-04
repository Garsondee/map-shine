import { Texture } from '@pixi/core';
import { Particle } from '../Particle';
import { IEmitterBehavior, BehaviorOrder } from './Behaviors';
import { BehaviorEditorConfig } from './editor/Types';
/**
 * A Texture behavior that assigns a texture to each particle from its list, in order, before looping around to the first
 * texture again. String values will be converted to textures with {@link ParticleUtils.GetTextureFromString}.
 *
 * Example config:
 * ```javascript
 * {
 *     type: 'textureOrdered',
 *     config: {
 *         textures: ["myTex1Id", "myTex2Id", "myTex3Id", "myTex4Id"],
 *     }
 * }
 * ```
 */
export declare class OrderedTextureBehavior implements IEmitterBehavior {
    static type: string;
    static editorConfig: BehaviorEditorConfig;
    order: BehaviorOrder;
    private textures;
    private index;
    constructor(config: {
        /**
         * Images to use for each particle, used in order before looping around
         */
        textures: Texture[];
    });
    initParticles(first: Particle): void;
}
