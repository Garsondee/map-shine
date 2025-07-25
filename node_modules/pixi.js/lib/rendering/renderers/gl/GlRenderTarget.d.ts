/**
 * Represents a render target.
 * @category rendering
 * @ignore
 */
export declare class GlRenderTarget {
    width: number;
    height: number;
    msaa: boolean;
    framebuffer: WebGLFramebuffer;
    resolveTargetFramebuffer: WebGLFramebuffer;
    msaaRenderBuffer: WebGLRenderbuffer[];
    depthStencilRenderBuffer: WebGLRenderbuffer;
}
