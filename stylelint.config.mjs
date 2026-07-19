export default {
  extends: ["stylelint-config-standard", "stylelint-config-html/astro"],
  ignoreFiles: [
    "dist/**",
    ".astro/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "node_modules/**",
    // Protected pre-existing transition experiment; it is outside this refactor.
    "src/styles/page-transitions.css",
  ],
  overrides: [
    {
      files: ["**/*.astro"],
      customSyntax: "postcss-html",
      rules: {
        // postcss-html treats each inline custom-property knob as a declaration block.
        "custom-property-empty-line-before": "never",
      },
    },
  ],
  rules: {
    // Allow the Utopia negative step (`--step--1`) while retaining kebab-case elsewhere.
    "custom-property-pattern": "^(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*|step--[0-9]+)$",
    // Prefix notation keeps the existing Media Queries Level 3 compatibility baseline.
    "media-feature-range-notation": "prefix",
  },
};
