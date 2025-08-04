import { EaseSegment, SimpleEase, Color } from './ParticleUtils';
import { BasicTweenable } from './EmitterConfig';
/**
 * A single step of a ValueList.
 */
export interface ValueStep<T> {
    /**
     * The color or number to use at this step.
     */
    value: T;
    /**
     * The percentage time of the particle's lifespan that this step happens at.
     * Values are between 0 and 1, inclusive.
     */
    time: number;
}
/**
 * Configuration for an interpolated or stepped list of numeric or color particle values.
 */
export interface ValueList<T> {
    /**
     * The ordered list of values.
     */
    list: ValueStep<T>[];
    /**
     * If the list is stepped. Stepped lists don't determine any in-between values, instead sticking with each value
     * until its time runs out.
     */
    isStepped?: boolean;
    /**
     * Easing that should be applied to this list, in order to alter how quickly the steps progress.
     */
    ease?: SimpleEase | EaseSegment[];
}
/**
 * A single node in a PropertyList.
 */
export declare class PropertyNode<V> {
    /**
     * Value for the node.
     */
    value: V;
    /**
     * Time value for the node. Between 0-1.
     */
    time: number;
    /**
     * The next node in line.
     */
    next: PropertyNode<V>;
    /**
     * If this is the first node in the list, controls if the entire list is stepped or not.
     */
    isStepped: boolean;
    ease: SimpleEase;
    /**
     * @param value The value for this node
     * @param time The time for this node, between 0-1
     * @param [ease] Custom ease for this list. Only relevant for the first node.
     */
    constructor(value: V, time: number, ease?: SimpleEase | EaseSegment[]);
    /**
     * Creates a list of property values from a data object {list, isStepped} with a list of objects in
     * the form {value, time}. Alternatively, the data object can be in the deprecated form of
     * {start, end}.
     * @param data The data for the list.
     * @param data.list The array of value and time objects.
     * @param data.isStepped If the list is stepped rather than interpolated.
     * @param data.ease Custom ease for this list.
     * @return The first node in the list
     */
    static createList<T extends (string | number)>(data: ValueList<T> | BasicTweenable<T>): PropertyNode<T extends string ? Color : T>;
}
