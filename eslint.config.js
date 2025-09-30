// eslint.config.js

import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // Apply ESLint recommended rules
  js.configs.recommended,

  // Apply TypeScript-ESLint recommended rules
  ...tseslint.configs.recommended,

  // Main configuration object for your project's JavaScript files.
  {
    // Apply this configuration only to the JavaScript files in your 'scripts' directory.
    files: ["scripts/**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        // --- Standard Foundry VTT Globals ---
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

        // --- Added Globals to Fix 'no-undef' Errors ---
        $: "readonly",
        Application: "readonly",
        CanvasLayer: "readonly",
        FilePicker: "readonly",
        FormApplication: "readonly",
        Handlebars: "readonly",
        renderTemplate: "readonly",
        Scene: "readonly",
      },
    },

    // Define custom rules and overrides for the recommended sets.
    rules: {
      // Disable the base ESLint rule to avoid conflicts with the TypeScript version.
      "no-unused-vars": "off",
      // Use the TypeScript-aware version of 'no-unused-vars'.
      // Allow underscore-prefixed variables to be unused (intentionally unused convention)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Allowing 'any' is practical for Foundry module development, especially with the global object.
      "@typescript-eslint/no-explicit-any": "off",

      // Allow aliasing 'this' to local variables (common pattern in callbacks/closures)
      "@typescript-eslint/no-this-alias": "off",
    },
  },

  // This should be the LAST item in the array to disable conflicting formatting rules.
  prettierConfig,
];
