/**
 * @fileoverview FontLoader - Dynamic Google Fonts loading utility
 * 
 * Utility class for dynamically loading Google Fonts into the document.
 * Manages font loading through Google Fonts API by injecting and updating
 * stylesheet links in the document head.
 * 
 * The loader is designed to be additive and idempotent, meaning:
 * - Multiple calls with the same fonts won't create duplicate requests
 * - New fonts are added to existing ones without removing previously loaded fonts
 * - Safe to call multiple times with different font sets
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.2.0
 * @since 1.0.0
 */

/**
 * Utility class for dynamically loading Google Fonts into the document.
 * 
 * @class FontLoader
 * @static
 * @example
 * // Load a single font family
 * FontLoader.load(['Roboto']);
 * 
 * // Load multiple font families
 * FontLoader.load(['Roboto', 'Open Sans', 'Montserrat']);
 * 
 * // Subsequent calls are additive
 * FontLoader.load(['Lato']); // Now all four fonts are loaded
 */
export class FontLoader {
  /** @type {string} Unique ID for the Google Fonts stylesheet element */
  static STYLESHEET_ID = "map-shine-google-fonts";

  /**
   * Loads one or more Google Fonts by injecting or updating a stylesheet link in the document head.
   * This function is additive and idempotent - calling it multiple times with overlapping
   * font families will only add new fonts, not duplicate existing ones.
   * 
   * @param {string[]} fontFamilies - An array of font family names to load.
   * 
   * @example
   * FontLoader.load(['Roboto', 'Open Sans']);
   * // Later...
   * FontLoader.load(['Lato']); // Adds Lato without removing Roboto/Open Sans
   */
  static load(fontFamilies) {
    const uniqueFontsToLoad = [...new Set(fontFamilies)].filter(Boolean);
    if (uniqueFontsToLoad.length === 0) return;

    const link =
      /** @type {HTMLLinkElement} */ (
        document.getElementById(this.STYLESHEET_ID)
      ) || this._createLink();

    const currentlyLoadedFonts = this._getLoadedFonts(link);

    const newFonts = uniqueFontsToLoad.filter(
      (font) => !currentlyLoadedFonts.has(font)
    );

    if (newFonts.length === 0) return;

    const allFonts = new Set([...currentlyLoadedFonts, ...newFonts]);

    const fontQuery = Array.from(allFonts)
      .map((font) => `family=${font.replace(/ /g, "+")}:wght@400;700`)
      .join("&");

    link.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;
  }

  /**
   * Creates and appends the stylesheet link element if it doesn't exist.
   * 
   * @returns {HTMLLinkElement} The link element.
   * @private
   */
  static _createLink() {
    const link = document.createElement("link");
    link.id = this.STYLESHEET_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return link;
  }

  /**
   * Parses the href of the stylesheet link to determine which fonts are already being loaded.
   * 
   * @param {HTMLLinkElement} link - The stylesheet link element.
   * @returns {Set<string>} A set of font family names.
   * @private
   */
  static _getLoadedFonts(link) {
    const loaded = new Set();
    if (!link.href) return loaded;

    try {
      const url = new URL(link.href);
      const families = url.searchParams.getAll("family");
      for (const family of families) {
        // Remove weight/style specifications to get the base family name
        const name = family.split(":")[0].replace(/\+/g, " ");
        loaded.add(name);
      }
    } catch {
      // The URL might be invalid if the href is not set yet, which is fine.
    }
    return loaded;
  }
}
