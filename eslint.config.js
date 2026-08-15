import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";
import { MAX_FILE_LINES, MAX_FUNCTION_LINES } from "./scripts/budgets.mjs";

const browserGlobals = {
  ...globals.browser,
  Animation: "readonly",
  Keyframe: "readonly",
  ViewTransition: "readonly",
};

export default [
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "node_modules/**",
      "src/styles/page-transitions.css",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-recommended"],
  {
    files: ["src/**/*.{ts,astro}", "tests/**/*.ts", "*.config.{js,mjs,ts}"],
    languageOptions: {
      globals: browserGlobals,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-explicit-any": "error",
      "max-lines": [
        "error",
        {
          max: MAX_FILE_LINES,
          skipBlankLines: false,
          skipComments: false,
        },
      ],
      "max-lines-per-function": [
        "error",
        {
          max: MAX_FUNCTION_LINES,
          skipBlankLines: false,
          skipComments: false,
          IIFEs: true,
        },
      ],
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...browserGlobals,
        ...globals.node,
      },
    },
  },
  {
    files: ["*.config.{js,mjs,ts}", "scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
