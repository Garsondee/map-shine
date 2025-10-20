/**
 * @fileoverview Font Family Options for Map Shine
 * 
 * Comprehensive collection of web fonts organized by category for UI elements.
 * Includes fonts for accessibility, body text, fantasy themes, handwritten styles,
 * headers, horror/gothic themes, modern/clean designs, monospaced fonts,
 * science fiction themes, and miscellaneous decorative fonts.
 * 
 * Category headers (prefixed with "--") have disabled: true to act as separators
 * in dropdown menus.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.1.52
 * @since 1.0.0
 */

/**
 * Comprehensive collection of web fonts organized by category for UI elements.
 * 
 * Categories include:
 * - Accessible: High-readability fonts for accessibility
 * - Body Text: Clean, readable fonts for paragraphs
 * - Fantasy: Medieval and fantasy-themed fonts
 * - Handwritten/Cursive: Casual and decorative script fonts
 * - Headers: Bold, impactful fonts for titles
 * - Horror/Gothic: Dark, atmospheric fonts
 * - Modern/Clean: Contemporary sans-serif fonts
 * - Monospaced: Fixed-width fonts for code/technical text
 * - Science Fiction: Futuristic and tech-themed fonts
 * - Miscellaneous: Other decorative and specialty fonts
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
