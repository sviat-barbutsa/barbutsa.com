import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_ONLY = process.argv.includes("--report");
const SOURCE_DIRS = ["src/components", "src/layouts", "src/lib", "src/pages", "src/styles", "src/theme"];
const REQUIRED_DIRS = [
  "src/lib/runtime",
  "src/lib/atlas",
  "src/lib/content",
  "src/lib/shell",
  "src/lib/status-bar",
  "src/components/layout",
  "src/styles/components",
  "src/theme/animations",
  "tests/unit",
  "tests/e2e",
];
const MAX_LINES = 250;
const MAX_FUNCTION_LINES = 120;
const EXTENSIONS = new Set([".ts", ".astro", ".css"]);
const OBSOLETE_ATLAS = new Set([
  "src/lib/atlas/config.ts",
  "src/lib/atlas/entities.ts",
  "src/lib/atlas/index.ts",
  "src/lib/atlas/math.ts",
  "src/lib/atlas/svg-atlas.ts",
]);
const OBSOLETE_STYLES = new Set(["src/styles/components.css"]);
const OBSOLETE_REFERENCES = /\b(?:createAtlas|arcPoint|routePosition)\b|atlas\/(?:config|entities|math|svg-atlas)/;

/**
 * Modules that must stay computable without a browser: given the same inputs they produce the same
 * outputs, so they can be unit-tested without a DOM and reasoned about without a clock.
 *
 * This freezes a boundary that already holds rather than demanding a refactor. A module earns a
 * place here by being pure today; adding one that is not will fail the check immediately.
 */
const PURE_MODULES = [
  "src/lib/atlas/model.ts",
  "src/lib/atlas/route-animator.ts",
  "src/lib/atlas/types.ts",
  "src/lib/canvas-engine/entity.ts",
  "src/lib/content/",
  "src/lib/flamenco/collision.ts",
  "src/lib/flamenco/geometry.ts",
  "src/lib/flamenco/menu-selection.ts",
  "src/lib/flamenco/runner-renderer.ts",
  "src/lib/runtime/pause-registry.ts",
  "src/lib/shell/types.ts",
  "src/theme/animations/",
  "src/theme/palette.ts",
];

// Not listed, deliberately: src/theme/state.ts owns the storage capability the way
// src/lib/runtime/reduced-motion.ts owns the media query. It takes `storage?: Storage` so callers
// and tests can inject, but the ambient fallback is the point of the module, not a leak from it.

/**
 * Ambient capabilities a pure module may not reach for.
 *
 * `Math.random` and `Date.now` are matched only where they are *called*. Passing either as an
 * injected default — `random: () => number = Math.random` — is how these modules stay testable, and
 * a rule that banned the reference outright would punish the very pattern it exists to encourage.
 */
const AMBIENT = [
  { label: "window", pattern: /\bwindow\b/ },
  { label: "document", pattern: /\bdocument\b/ },
  { label: "localStorage", pattern: /\blocalStorage\b/ },
  { label: "Math.random()", pattern: /\bMath\.random\s*\(/ },
  { label: "Date.now()", pattern: /\bDate\.now\s*\(/ },
  { label: "performance.now()", pattern: /\bperformance\.now\s*\(/ },
  { label: "crypto", pattern: /\bcrypto\b/ },
];

/**
 * Comments and string literals are removed before matching. Without this the rule fires on prose —
 * "Transfer size of this document" is a doc comment, not a DOM access — and a checker that cries
 * wolf is one people learn to silence.
 */
function stripCommentsAndStrings(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(/`(?:\\.|[^`\\])*`/g, '""')
    .replace(/'(?:\\.|[^'\\\n])*'/g, '""')
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""');
}

function checkPurity(file, text) {
  if (!file.endsWith(".ts")) return [];
  if (!PURE_MODULES.some((entry) => (entry.endsWith("/") ? file.startsWith(entry) : file === entry))) return [];

  const code = stripCommentsAndStrings(text);
  return AMBIENT.filter(({ pattern }) => pattern.test(code)).map(
    ({ label }) => `${file} is a pure module but reaches for ${label}`,
  );
}

function toPosix(file) {
  return file.split(path.sep).join("/");
}

function walk(dir) {
  const full = path.join(ROOT, dir);
  if (!existsSync(full)) return [];
  const entries = [];
  for (const name of readdirSync(full)) {
    const child = path.join(full, name);
    const rel = toPosix(path.relative(ROOT, child));
    if (["dist", ".astro", "coverage", "node_modules"].includes(name)) continue;
    if (statSync(child).isDirectory()) entries.push(...walk(rel));
    else entries.push(rel);
  }
  return entries;
}

function countLines(text) {
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function checkFunctionBudgets(file, text) {
  if (!file.endsWith(".ts")) return [];
  const violations = [];
  const lines = text.split(/\r?\n/);
  const starts = [];
  const patterns = [
    /\bfunction\s+\w+[^(]*\([^)]*\)\s*[:\w\s<>|&,\x5B\x5D?]*\{/,
    /(?:const|let)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*[:\w\s<>|&,\x5B\x5D?]*=>\s*\{/,
    /(?:const|let)\s+\w+\s*=\s*(?:async\s*)?\w+\s*=>\s*\{/,
    /^\s*(?:private\s+|public\s+|protected\s+)?\w+\([^)]*\)\s*[:\w\s<>|&,\x5B\x5D?]*\{/,
  ];
  for (let i = 0; i < lines.length; i += 1) {
    if (patterns.some((pattern) => pattern.test(lines[i] ?? ""))) starts.push(i);
  }
  for (const start of starts) {
    let depth = 0;
    let seenOpen = false;
    for (let i = start; i < lines.length; i += 1) {
      const line = lines[i] ?? "";
      for (const char of line) {
        if (char === "{") {
          depth += 1;
          seenOpen = true;
        } else if (char === "}") {
          depth -= 1;
        }
      }
      if (seenOpen && depth <= 0) {
        const size = i - start + 1;
        if (size > MAX_FUNCTION_LINES) {
          violations.push(`${file}:${start + 1} function has ${size} lines`);
        }
        break;
      }
    }
  }
  return violations;
}

function preserveNewlines(value) {
  return value.replace(/[^\n]/g, " ");
}

function checkAuthoredPixelValues(file, text) {
  if (!file.endsWith(".css") && !file.endsWith(".astro")) return [];

  const violations = [];
  const exactLines = new Set(
    text
      .split(/\r?\n/)
      .map((line, index) => (line.includes("size-system-exact") ? index + 1 : null))
      .filter((line) => line !== null),
  );
  const source = text.replace(/\/\*[\s\S]*?\*\//g, preserveNewlines);

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const lineNumber = index + 1;
    if (exactLines.has(lineNumber)) continue;

    const fractional = line.match(/-?(?:\d+\.\d+|\.\d+)px\b/g) ?? [];
    for (const value of fractional) {
      violations.push(`${file}:${lineNumber} uses fractional authored pixel value ${value}`);
    }

    const integers = line.matchAll(/(?<![\d.])-?(\d+)px\b/g);
    for (const match of integers) {
      const value = Number(match[1]);
      if (value >= 24 && value % 2 !== 0) {
        violations.push(`${file}:${lineNumber} uses odd authored pixel value ${match[0]} at or above 24px`);
      }
    }
  }

  return violations;
}

const violations = [];

for (const dir of REQUIRED_DIRS) {
  if (!existsSync(path.join(ROOT, dir))) {
    violations.push(`missing required directory: ${dir}`);
  }
}

for (const entry of PURE_MODULES) {
  if (!existsSync(path.join(ROOT, entry))) {
    violations.push(`PURE_MODULES lists a path that no longer exists: ${entry}`);
  }
}

if (existsSync(path.join(ROOT, "src/tests"))) {
  violations.push("tests must not live under src/tests");
}

for (const file of walk("src")) {
  if (file.includes("/tests/") || file.startsWith("src/tests/")) {
    violations.push(`test file under src: ${file}`);
  }
}

for (const obsolete of OBSOLETE_ATLAS) {
  if (existsSync(path.join(ROOT, obsolete))) {
    violations.push(`obsolete Canvas Atlas file still exists: ${obsolete}`);
  }
}

for (const obsolete of OBSOLETE_STYLES) {
  if (existsSync(path.join(ROOT, obsolete))) {
    violations.push(`obsolete monolithic stylesheet still exists: ${obsolete}`);
  }
}

for (const file of SOURCE_DIRS.flatMap(walk)) {
  if (!EXTENSIONS.has(path.extname(file))) continue;
  if (file === "src/styles/page-transitions.css") continue;
  const text = readFileSync(path.join(ROOT, file), "utf8");
  const lines = countLines(text);
  if (lines > MAX_LINES) {
    violations.push(`${file} has ${lines} lines (max ${MAX_LINES})`);
  }
  violations.push(...checkFunctionBudgets(file, text));
  violations.push(...checkAuthoredPixelValues(file, text));
  violations.push(...checkPurity(file, text));
  if (
    text.includes("canvas-engine/registry") ||
    text.includes("./registry") ||
    text.includes("../canvas-engine/registry")
  ) {
    violations.push(`${file} imports generic pause coordination from canvas-engine`);
  }
  if (OBSOLETE_REFERENCES.test(text)) {
    violations.push(`${file} references obsolete Canvas/SVG Atlas path`);
  }
}

if (violations.length) {
  console.error("Architecture budget violations:");
  for (const violation of violations) console.error(`- ${violation}`);
  if (!REPORT_ONLY) process.exit(1);
} else {
  console.log("Architecture budget passed.");
}
