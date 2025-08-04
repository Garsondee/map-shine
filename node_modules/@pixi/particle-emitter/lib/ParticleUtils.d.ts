import { Texture } from '@pixi/core';
import { IPointData } from '@pixi/math';
import { PropertyNode, ValueStep } from './PropertyNode';
/**
 * The method used by behaviors to fetch textures. Defaults to Texture.from.
 */
export declare let GetTextureFromString: (d: string) => Texture;
/**
 * A color value, split apart for interpolation.
 */
export interface Color {
    r: number;
    g: number;
    b: number;
    a?: number;
}
export interface EaseSegment {
    cp: number;
    s: number;
    e: number;
}
/**
 * The basic easing function used. Takes in a value between 0-1, and outputs another value between 0-1.
 * For example, a basic quadratic in ease would be `(time) => time * time`
 */
export declare type SimpleEase = (time: number) => number;
/**
 * If errors and warnings should be logged within the library.
 */
export declare const verbose = false;
export declare const DEG_TO_RADS: number;
/**
 * Rotates a point by a given angle.
 * @param angle The angle to rotate by in radians
 * @param p The point to rotate around 0,0.
 */
export declare function rotatePoint(angle: number, p: IPointData): void;
/**
 * Combines separate color components (0-255) into a single uint color.
 * @param r The red value of the color
 * @param g The green value of the color
 * @param b The blue value of the color
 * @return The color in the form of 0xRRGGBB
 */
export declare function combineRGBComponents(r: number, g: number, b: number): number;
/**
 * Returns the length (or magnitude) of this point.
 * @param point The point to measure length
 * @return The length of this point.
 */
export declare function length(point: IPointData): number;
/**
 * Reduces the point to a length of 1.
 * @param point The point to normalize
 */
export declare function normalize(point: IPointData): void;
/**
 * Multiplies the x and y values of this point by a value.
 * @param point The point to scaleBy
 * @param value The value to scale by.
 */
export declare function scaleBy(point: IPointData, value: number): void;
/**
 * Converts a hex string from "#AARRGGBB", "#RRGGBB", "0xAARRGGBB", "0xRRGGBB",
 * "AARRGGBB", or "RRGGBB" to an object of ints of 0-255, as
 * {r, g, b, (a)}.
 * @param color The input color string.
 * @param output An object to put the output in. If omitted, a new object is created.
 * @return The object with r, g, and b properties, possibly with an a property.
 */
export declare function hexToRGB(color: string, output?: Color): Color;
/**
 * Generates a custom ease function, based on the GreenSock custom ease, as demonstrated
 * by the related tool at http://www.greensock.com/customease/.
 * @param segments An array of segments, as created by
 * http://www.greensock.com/customease/.
 * @return A function that calculates the percentage of change at
 *                    a given point in time (0-1 inclusive).
 */
export declare function generateEase(segments: EaseSegment[]): SimpleEase;
/**
 * Gets a blend mode, ensuring that it is valid.
 * @param name The name of the blend mode to get.
 * @return The blend mode as specified in the PIXI.BLEND_MODES enumeration.
 */
export declare function getBlendMode(name: string): number;
/**
 * Converts a list of {value, time} objects starting at time 0 and ending at time 1 into an evenly
 * spaced stepped list of PropertyNodes for color values. This is primarily to handle conversion of
 * linear gradients to fewer colors, allowing for some optimization for Canvas2d fallbacks.
 * @param list The list of data to convert.
 * @param [numSteps=10] The number of steps to use.
 * @return The blend mode as specified in the PIXI.blendModes enumeration.
 */
export declare function createSteppedGradient(list: ValueStep<string>[], numSteps?: number): PropertyNode<Color>;
