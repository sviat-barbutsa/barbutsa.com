/**
 * Size budgets, defined once. ESLint enforces them for TS (max-lines /
 * max-lines-per-function) and check-architecture.mjs applies the same numbers to
 * .astro and .css. Both import from here so the two configs can't get different
 * numbers over time.
 */
export const MAX_FILE_LINES = 250;
export const MAX_FUNCTION_LINES = 120;
