import { Container, DisplayObject } from '@pixi/display';
import { Renderer } from '@pixi/core';
import { Rectangle } from '@pixi/math';
/** Interface for a child of a LinkedListContainer (has the prev/next properties added) */
export interface LinkedListChild extends DisplayObject {
    nextChild: LinkedListChild | null;
    prevChild: LinkedListChild | null;
}
/**
 * A semi-experimental Container that uses a doubly linked list to manage children instead of an
 * array. This means that adding/removing children often is not the same performance hit that
 * it would to be continually pushing/splicing.
 * However, this is primarily intended to be used for heavy particle usage, and may not handle
 * edge cases well if used as a complete Container replacement.
 */
export declare class LinkedListContainer extends Container {
    private _firstChild;
    private _lastChild;
    private _childCount;
    get firstChild(): LinkedListChild;
    get lastChild(): LinkedListChild;
    get childCount(): number;
    addChild<T extends DisplayObject[]>(...children: T): T[0];
    addChildAt<T extends DisplayObject>(child: T, index: number): T;
    /**
     * Adds a child to the container to be rendered below another child.
     *
     * @param child The child to add
     * @param relative - The current child to add the new child relative to.
     * @return The child that was added.
     */
    addChildBelow<T extends DisplayObject>(child: T, relative: DisplayObject): T;
    /**
     * Adds a child to the container to be rendered above another child.
     *
     * @param child The child to add
     * @param relative - The current child to add the new child relative to.
     * @return The child that was added.
     */
    addChildAbove<T extends DisplayObject>(child: T, relative: DisplayObject): T;
    swapChildren(child: DisplayObject, child2: DisplayObject): void;
    getChildIndex(child: DisplayObject): number;
    setChildIndex(child: DisplayObject, index: number): void;
    removeChild<T extends DisplayObject[]>(...children: T): T[0];
    getChildAt(index: number): DisplayObject;
    removeChildAt(index: number): DisplayObject;
    removeChildren(beginIndex?: number, endIndex?: number): DisplayObject[];
    /**
     * Updates the transform on all children of this container for rendering.
     * Copied from and overrides PixiJS v5 method (v4 method is identical)
     */
    updateTransform(): void;
    /**
     * Recalculates the bounds of the container.
     * Copied from and overrides PixiJS v5 method (v4 method is identical)
     */
    calculateBounds(): void;
    /**
     * Retrieves the local bounds of the displayObject as a rectangle object. Copied from and overrides PixiJS v5 method
     */
    getLocalBounds(rect?: Rectangle, skipChildrenUpdate?: boolean): Rectangle;
    /**
     * Renders the object using the WebGL renderer. Copied from and overrides PixiJS v5 method
     */
    render(renderer: Renderer): void;
    /**
     * Render the object using the WebGL renderer and advanced features. Copied from and overrides PixiJS v5 method
     */
    protected renderAdvanced(renderer: Renderer): void;
    /**
     * Renders the object using the Canvas renderer. Copied from and overrides PixiJS Canvas mixin in V5 and V6.
     */
    renderCanvas(renderer: any): void;
}
