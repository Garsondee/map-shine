'use strict';

var TextStyle = require('../text/TextStyle.js');
var bitmapTextSplit = require('../text-bitmap/utils/bitmapTextSplit.js');
var AbstractSplitText = require('./AbstractSplitText.js');

"use strict";
const _SplitBitmapText = class _SplitBitmapText extends AbstractSplitText.AbstractSplitText {
  constructor(config) {
    const completeOptions = {
      ..._SplitBitmapText.defaultOptions,
      ...config
    };
    super(completeOptions);
  }
  /**
   * Creates a SplitBitmapText instance from an existing text object.
   * Useful for converting standard Text or BitmapText objects into segmented versions.
   * @param text - The source text object to convert
   * @param options - Additional splitting options
   * @returns A new SplitBitmapText instance
   * @example
   * ```ts
   * const bitmapText = new BitmapText({
   *   text: 'Bitmap Text',
   *   style: { fontFamily: 'Arial' }
   * });
   *
   * const segmented = SplitBitmapText.from(bitmapText);
   *
   * // with additional options
   * const segmentedWithOptions = SplitBitmapText.from(bitmapText, {
   *   autoSplit: false,
   *   lineAnchor: 0.5,
   *   wordAnchor: { x: 0, y: 0.5 },
   * })
   * ```
   */
  static from(text, options) {
    const completeOptions = {
      ..._SplitBitmapText.defaultOptions,
      ...options,
      text: text.text,
      style: new TextStyle.TextStyle(text.style)
    };
    return new _SplitBitmapText({
      ...completeOptions
    });
  }
  splitFn() {
    return bitmapTextSplit.bitmapTextSplit({
      text: this._originalText,
      style: this._style,
      chars: this._canReuseChars ? this.chars : []
    });
  }
};
/**
 * Default configuration options for SplitBitmapText instances.
 * @example
 * ```ts
 * // Override defaults globally
 * SplitBitmapText.defaultOptions = {
 *   autoSplit: false,
 *   lineAnchor: 0.5,  // Center alignment
 *   wordAnchor: { x: 0, y: 0.5 },  // Left-center
 *   charAnchor: { x: 0.5, y: 1 }   // Bottom-center
 * };
 * ```
 */
_SplitBitmapText.defaultOptions = {
  autoSplit: true,
  // Auto-update on text/style changes
  lineAnchor: 0,
  // Top-left alignment
  wordAnchor: 0,
  // Top-left alignment
  charAnchor: 0
  // Top-left alignment
};
let SplitBitmapText = _SplitBitmapText;

exports.SplitBitmapText = SplitBitmapText;
//# sourceMappingURL=SplitBitmapText.js.map
