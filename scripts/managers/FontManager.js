/**
 * @fileoverview Font Management System for Map Shine Module
 *
 * This file contains the font management system including:
 * - Comprehensive collection of web fonts organized by category
 * - Dynamic Google Fonts loading system
 * - Font preloading and caching utilities
 *
 * @author Garsondee
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * Comprehensive collection of web fonts organized by category for UI elements.
 * Includes fonts for accessibility, body text, fantasy themes, handwritten styles,
 * headers, horror/gothic themes, modern/clean designs, monospaced fonts,
 * science fiction themes, and miscellaneous decorative fonts.
 *
 * Category headers (prefixed with "--") have disabled: true to act as separators
 * in dropdown menus.
 *
 * @constant {Object}
 * @property {Object|string} [fontName] - Font configuration object or font family string
 * @property {boolean} [fontName.disabled] - Whether this entry is a disabled category header
 */
export const FONT_CHOICES = {
  "-- Accessible --": { disabled: true },
  "Atkinson Hyperlegible": "Atkinson Hyperlegible",
  "Comic Sans MS": "Comic Sans MS",
  Inter: "Inter",
  Lexend: "Lexend",
  "Noto Sans": "Noto Sans",
  "Open Sans": "Open Sans",
  Verdana: "Verdana",
  "-- Body Text --": { disabled: true },
  Alegreya: "Alegreya",
  "Crimson Text": "Crimson Text",
  "EB Garamond": "EB Garamond",
  Lato: "Lato",
  "Libre Baskerville": "Libre Baskerville",
  Lora: "Lora",
  Merriweather: "Merriweather",
  "PT Serif": "PT Serif",
  Roboto: "Roboto",
  "Source Sans Pro": "Source Sans Pro",
  "-- Fantasy --": { disabled: true },
  Cinzel: "Cinzel",
  "Cormorant Garamond": "Cormorant Garamond",
  "Gentium Book Basic": "Gentium Book Basic",
  "IM Fell English": "IM Fell English",
  Lancelot: "Lancelot",
  MedievalSharp: "MedievalSharp",
  "Old Standard TT": "Old Standard TT",
  "Playfair Display": "Playfair Display",
  "Uncial Antiqua": "Uncial Antiqua",
  "-- Handwritten/Cursive --": { disabled: true },
  Caveat: "Caveat",
  "Dancing Script": "Dancing Script",
  Kalam: "Kalam",
  "Patrick Hand": "Patrick Hand",
  "Permanent Marker": "Permanent Marker",
  "Rock Salt": "Rock Salt",
  Sacramento: "Sacramento",
  "-- Headers --": { disabled: true },
  "Abril Fatface": "Abril Fatface",
  Anton: "Anton",
  "Archivo Black": "Archivo Black",
  Arvo: "Arvo",
  Bangers: "Bangers",
  "Bebas Neue": "Bebas Neue",
  Montserrat: "Montserrat",
  Oswald: "Oswald",
  "Passion One": "Passion One",
  Raleway: "Raleway",
  "Roboto Slab": "Roboto Slab",
  "-- Horror/Gothic --": { disabled: true },
  Butcherman: "Butcherman",
  Creepster: "Creepster",
  "Metal Mania": "Metal Mania",
  Nosifier: "Nosifier",
  UnifrakturMaguntia: "UnifrakturMaguntia",
  "-- Modern/Clean --": { disabled: true },
  "Exo 2": "Exo 2",
  "Nunito Sans": "Nunito Sans",
  Poppins: "Poppins",
  "Titillium Web": "Titillium Web",
  "Work Sans": "Work Sans",
  "-- Monospaced --": { disabled: true },
  "Anonymous Pro": "Anonymous Pro",
  "Cutive Mono": "Cutive Mono",
  "IBM Plex Mono": "IBM Plex Mono",
  Inconsolata: "Inconsolata",
  "Roboto Mono": "Roboto Mono",
  "Source Code Pro": "Source Code Pro",
  VT323: "VT323",
  "-- Science Fiction --": { disabled: true },
  Audiowide: "Audiowide",
  Geo: "Geo",
  "Keania One": "Keania One",
  Orbitron: "Orbitron",
  "Share Tech Mono": "Share Tech Mono",
  "Space Mono": "Space Mono",
  "Stalinist One": "Stalinist One",
  Teko: "Teko",
  "-- Miscellaneous --": { disabled: true },
  Bungee: "Bungee",
  Lobster: "Lobster",
  Pacifico: "Pacifico",
  "Press Start 2P": "Press Start 2P",
  Signika: "Signika",
};

/**
 * Utility class for dynamically loading Google Fonts into the document.
 * Manages font loading through Google Fonts API by injecting and updating
 * stylesheet links in the document head.
 *
 * The loader is designed to be additive and idempotent, meaning:
 * - Multiple calls with the same fonts won't create duplicate requests
 * - New fonts are added to existing ones without removing previously loaded fonts
 * - Safe to call multiple times with different font sets
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
  static STYLESHEET_ID = "map-shine-google-fonts";

  /**
   * Loads one or more Google Fonts by injecting or updating a stylesheet link in the document head.
   * This function is additive and idempotent.
   * @param {string[]} fontFamilies - An array of font family names to load.
   */
  static load(fontFamilies) {
    const uniqueFontsToLoad = [...new Set(fontFamilies)].filter(Boolean);
    if (uniqueFontsToLoad.length === 0) return;

    const link =
      document.getElementById(this.STYLESHEET_ID) || this._createLink();
    // @ts-ignore
    const currentlyLoadedFonts = this._getLoadedFonts(link);

    const newFonts = uniqueFontsToLoad.filter(
      (font) => !currentlyLoadedFonts.has(font)
    );

    if (newFonts.length === 0) return;

    const allFonts = new Set([...currentlyLoadedFonts, ...newFonts]);

    const fontQuery = Array.from(allFonts)
      .map((font) => `family=${font.replace(/ /g, "+")}:wght@400;700`)
      .join("&");

    // @ts-ignore
    link.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;
  }

  /**
   * Creates and appends the stylesheet link element if it doesn't exist.
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
    } catch (e) {
      // The URL might be invalid if the href is not set yet, which is fine.
    }
    return loaded;
  }
}
