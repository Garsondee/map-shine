// eslint.config.js

import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  // Apply ESLint recommended rules
  js.configs.recommended,

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
      // Use base rule; allow underscore-prefixed unused vars
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },

  // This should be the LAST item in the array to disable conflicting formatting rules.
  prettierConfig,
];
