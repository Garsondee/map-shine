// eslint.config.js

import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // Main configuration object for your project's JavaScript files.
  {
    // Apply this configuration only to the JavaScript files in your 'scripts' directory.
    files: ["scripts/**/*.js"],

    // We combine the recommended rules from ESLint and TypeScript-ESLint.
    // tseslint.configs.recommended includes the necessary parser and plugin setup.
    ...js.configs.recommended,
    ...tseslint.configs.recommended,

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        // Foundry VTT Globals
        game: "readonly",
        canvas: "readonly",
        Hooks: "readonly",
        libWrapper: "readonly",
        PIXI: "readonly",
        CONFIG: "readonly",
        ui: "readonly",
        Dialog: "readonly",
        foundry: "readonly",
        CONST: "readonly",
      },
    },

    // Define custom rules and overrides for the recommended sets.
    rules: {
      // Disable the base ESLint rule to avoid conflicts with the TypeScript version.
      "no-unused-vars": "off",
      // Use the TypeScript-aware version of 'no-unused-vars'.
      "@typescript-eslint/no-unused-vars": "warn",

      // Allowing 'any' is practical for Foundry module development, especially with the global object.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // This should be the LAST item in the array to disable conflicting formatting rules.
  prettierConfig,
];