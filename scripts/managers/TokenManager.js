/**
 * @fileoverview Token management utilities for Map Shine Module
 *
 * This file contains the TokenManager class which handles tracking the active token
 * for various effects and interactions within the Map Shine module.
 *
 * @author Garsondee
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * Manages the active token for the Map Shine module.
 *
 * This manager tracks which token is currently "active" for the purposes of
 * dynamic exposure effects and other token-based visual enhancements. It handles
 * both GM and player scenarios, with different logic for each:
 *
 * - For players: Prioritizes controlled tokens, falls back to assigned character
 * - For GMs: Uses the first token in the controlled set
 *
 * @class TokenManager
 * @since 1.0.0
 */
class TokenManager {
  constructor() {
    this.activeToken = null;
    this._boundOnControlToken = this._onControlToken.bind(this);
    this._boundOnUpdateUser = this._onUpdateUser.bind(this);
  }

  /**
   * Initializes the TokenManager by registering hooks and setting initial state.
   */
  initialize() {
    Hooks.on("controlToken", this._boundOnControlToken);
    Hooks.on("updateUser", this._boundOnUpdateUser);
    this._updateActiveToken(); // Initial check
    console.log("Map Shine | TokenManager initialized.");
  }

  /**
   * Destroys the TokenManager by removing hooks and clearing state.
   */
  destroy() {
    Hooks.off("controlToken", this._boundOnControlToken);
    Hooks.off("updateUser", this._boundOnUpdateUser);
    this.activeToken = null;
  }

  /**
   * Handles the controlToken hook event.
   * @private
   */
  _onControlToken() {
    // This hook is sufficient for both GM and player cases where they select/deselect tokens.
    this._updateActiveToken();
  }

  /**
   * Handles the updateUser hook event.
   * @param {User} user - The user being updated
   * @param {object} data - The update data
   * @private
   */
  _onUpdateUser(user, data) {
    // If the current user's character changes, re-evaluate.
    if (user.id === game.user.id && "character" in data) {
      this._updateActiveToken();
    }
  }

  /**
   * Updates the active token based on current game state.
   * @private
   */
  _updateActiveToken() {
    // For players, prioritize controlled tokens. If none, fall back to their assigned character if it's on the scene.
    if (!game.user.isGM) {
      const controlled = canvas.tokens.controlled;
      if (controlled.length > 0) {
        this.activeToken = controlled[0]; // Use the first controlled token
      } else if (game.user.character) {
        // Check if the character has a token on the current scene
        const characterToken = canvas.tokens.placeables.find(
          (t) => t.document.actorId === game.user.character.id
        );
        this.activeToken = characterToken || null;
      }
    } else {
      // For GMs, it's simply the first token in the controlled set.
      const controlled = canvas.tokens.controlled;
      this.activeToken = controlled.length > 0 ? controlled[0] : null;
    }

    // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
    Hooks.callAll("mapShine:activeTokenChanged", this.activeToken);
  }

  /**
   * Gets the currently active token, ensuring it's still valid.
   * @returns {Token|null} The active token or null if none
   */
  getActiveToken() {
    // Ensure the token is still valid on the canvas by checking if it's still in the controlled tokens
    // or if it exists in the canvas tokens collection
    if (
      this.activeToken &&
      canvas.tokens.placeables.includes(this.activeToken)
    ) {
      return this.activeToken;
    }
    // If the stored token is no longer valid, try to find a new one.
    this._updateActiveToken();
    return this.activeToken;
  }
}

// Export the TokenManager class
export { TokenManager };
