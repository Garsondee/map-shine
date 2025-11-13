import { hexToRgbArray } from "./ColorUtils.js";

/**
 * Generates separate color and alpha lists for the particle emitter from a single gradient array.
 * @param {Array<object>} gradient - An array of stop objects, each with {time, color, alpha}.
 * @returns {{isColorStatic: boolean, staticColor?: string, colorList?: object, isAlphaStatic: boolean, staticAlpha?: number, alphaList?: object}} An object containing the config lists or static values for the behaviors.
 */
export function generateBehaviorListsFromGradient(gradient) {
  if (!gradient || gradient.length === 0) {
    return {
      isColorStatic: true,
      staticColor: "#ffffff",
      isAlphaStatic: true,
      staticAlpha: 1.0,
    };
  }

  const sortedGradient = [...gradient].sort((a, b) => a.time - b.time);

  const firstColor = sortedGradient[0].color;
  const allColorsSame = sortedGradient.every(
    (stop) => stop.color === firstColor
  );

  const firstAlpha = sortedGradient[0].alpha;
  const allAlphasSame = sortedGradient.every(
    (stop) => Math.abs(stop.alpha - firstAlpha) < 0.001
  );

  const result = {
    isColorStatic: allColorsSame,
    isAlphaStatic: allAlphasSame,
  };

  if (allColorsSame) {
    result.staticColor = firstColor;
  } else {
    result.colorList = {
      list: sortedGradient.map((s) => ({ value: s.color, time: s.time })),
    };
  }

  if (allAlphasSame) {
    result.staticAlpha = firstAlpha;
  } else {
    result.alphaList = {
      list: sortedGradient.map((s) => ({ value: s.alpha, time: s.time })),
    };
  }

  return result;
}

/**
 * Generates a brightness list for a particle behavior from a gradient array.
 * @param {Array<object>} gradient - An array of stop objects, each with {time, color, alpha}.
 * @returns {object} A config list for a value-based behavior.
 */
export function generateEmissiveListFromGradient(gradient) {
  if (!gradient || gradient.length < 1) {
    // Fallback to a single node list representing no emission.
    return { list: [{ value: 0, time: 0 }] };
  }

  const sortedGradient = [...gradient].sort((a, b) => a.time - b.time);
  const valueList = { list: [] };
  const lum_weights = { r: 0.299, g: 0.587, b: 0.114 };

  for (const stop of sortedGradient) {
    const rgb = hexToRgbArray(stop.color); // returns [r,g,b] in 0-1 range
    const luminance =
      rgb[0] * lum_weights.r + rgb[1] * lum_weights.g + rgb[2] * lum_weights.b;
    // The emissive strength is the color's brightness multiplied by its alpha.
    const emissiveValue = luminance * stop.alpha;
    valueList.list.push({
      value: emissiveValue,
      time: stop.time,
    });
  }

  // WORKAROUND for particle library bug with static lists.
  // If all luminance values in the list are effectively the same,
  // return a list with only a single node. The interpolator will
  // treat this as a static value, avoiding the bug.
  if (valueList.list.length > 1) {
    const firstValue = valueList.list[0].value;
    const allSame = valueList.list.every(
      (item) => Math.abs(item.value - firstValue) < 0.001
    );
    if (allSame) {
      // Ensure the single node has a time of 0 for correctness.
      return { list: [{ value: firstValue, time: 0 }] };
    }
  }

  return valueList;
}

/**
 * Generates an emissive color list from a gradient for use in particle behaviors.
 * Unlike generateEmissiveListFromGradient, this preserves full RGB color information.
 * @param {Array<object>} gradient - An array of stop objects, each with {time, color, alpha}.
 * @returns {object} A config object with both color and brightness lists.
 */
export function generateEmissiveColorListFromGradient(gradient) {
  if (!gradient || gradient.length < 1) {
    // Fallback to white with no emission
    return {
      colorList: [{ value: 0xffffff, time: 0 }],
      brightnessList: [{ value: 0, time: 0 }],
    };
  }

  const sortedGradient = [...gradient].sort((a, b) => a.time - b.time);
  const colorList = [];
  const brightnessList = [];
  const lum_weights = { r: 0.299, g: 0.587, b: 0.114 };

  for (const stop of sortedGradient) {
    const rgb = hexToRgbArray(stop.color); // returns [r,g,b] in 0-1 range

    // Convert RGB to integer tint value (0xRRGGBB)
    const r8 = Math.round(rgb[0] * 255);
    const g8 = Math.round(rgb[1] * 255);
    const b8 = Math.round(rgb[2] * 255);
    const tintValue = (r8 << 16) | (g8 << 8) | b8;

    // Calculate luminance for brightness
    const luminance =
      rgb[0] * lum_weights.r + rgb[1] * lum_weights.g + rgb[2] * lum_weights.b;
    const brightnessValue = luminance * stop.alpha;

    colorList.push({
      value: tintValue,
      time: stop.time,
    });

    brightnessList.push({
      value: brightnessValue,
      time: stop.time,
    });
  }

  // Handle the PropertyNode.createList bug where two identical values cause issues
  if (brightnessList.length > 1) {
    const firstBrightness = brightnessList[0].value;
    const allBrightnessSame = brightnessList.every(
      (item) => Math.abs(item.value - firstBrightness) < 0.001
    );
    if (allBrightnessSame) {
      // Reduce to single node to avoid the bug
      return {
        colorList: { list: colorList },
        brightnessList: { list: [{ value: firstBrightness, time: 0 }] },
      };
    }
  }

  return {
    colorList: { list: colorList },
    brightnessList: { list: brightnessList },
  };
}
