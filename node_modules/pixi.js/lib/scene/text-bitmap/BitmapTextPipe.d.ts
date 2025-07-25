import { ExtensionType } from '../../extensions/Extensions';
import { Graphics } from '../graphics/shared/Graphics';
import type { InstructionSet } from '../../rendering/renderers/shared/instructions/InstructionSet';
import type { RenderPipe } from '../../rendering/renderers/shared/instructions/RenderPipe';
import type { Renderer } from '../../rendering/renderers/types';
import type { BitmapText } from './BitmapText';
/** @internal */
export declare class BitmapTextGraphics extends Graphics {
    destroy(): void;
}
/** @internal */
export declare class BitmapTextPipe implements RenderPipe<BitmapText> {
    /** @ignore */
    static extension: {
        readonly type: readonly [ExtensionType.WebGLPipes, ExtensionType.WebGPUPipes, ExtensionType.CanvasPipes];
        readonly name: "bitmapText";
    };
    private _renderer;
    constructor(renderer: Renderer);
    validateRenderable(bitmapText: BitmapText): boolean;
    addRenderable(bitmapText: BitmapText, instructionSet: InstructionSet): void;
    updateRenderable(bitmapText: BitmapText): void;
    private _updateContext;
    private _getGpuBitmapText;
    initGpuText(bitmapText: BitmapText): BitmapTextGraphics;
    private _updateDistanceField;
    destroy(): void;
}
