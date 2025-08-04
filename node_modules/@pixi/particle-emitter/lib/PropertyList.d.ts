import { SimpleEase } from './ParticleUtils';
import { PropertyNode } from './PropertyNode';
/**
 * Singly linked list container for keeping track of interpolated properties for particles.
 * Each Particle will have one of these for each interpolated property.
 */
export declare class PropertyList<V> {
    /**
     * The first property node in the linked list.
     */
    first: PropertyNode<V>;
    /**
     * Calculates the correct value for the current interpolation value. This method is set in
     * the reset() method.
     * @param lerp The interpolation value from 0-1.
     * @return The interpolated value. Colors are converted to the hex value.
     */
    interpolate: (lerp: number) => number;
    /**
     * A custom easing method for this list.
     * @param lerp The interpolation value from 0-1.
     * @return The eased value, also from 0-1.
     */
    ease: SimpleEase;
    /**
     * If this list manages colors, which requires a different method for interpolation.
     */
    private isColor;
    /**
     * @param isColor If this list handles color values
     */
    constructor(isColor?: boolean);
    /**
     * Resets the list for use.
     * @param first The first node in the list.
     * @param first.isStepped If the values should be stepped instead of interpolated linearly.
     */
    reset(first: PropertyNode<V>): void;
}
