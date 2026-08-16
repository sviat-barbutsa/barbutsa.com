/**
 * Checks the built site against a real local Workers static-asset server (not
 * Astro's preview server), so the deploy config is actually exercised:
 *
 *   - the root serves the page
 *   - a missing path returns the styled 404, because not_found_handling is "404-page"
 *   - dist/_headers really applies: the generated CSP and the security headers on the document,
 *     immutable caching on hashed assets, and no immutable caching on the document
 *
 * Windows-only - it shells out to curl.exe and taskkill.
 */

import { spawn } from "node:child_process";

const port = process.env.WRANGLER_LOCAL_PORT ?? "8789";
const origin = `http://127.0.0.1:${port}`;
const startupTimeoutMs = 30_000;

/** every document response must have these - they can only come from dist/_headers */
const requiredDocumentHeaders = [
  ["content-security-policy", /default-src 'self'/],
  ["referrer-policy", /no-referrer/],
  ["x-content-type-options", /nosniff/],
  ["x-frame-options", /DENY/],
  ["cross-origin-opener-policy", /same-origin/],
];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";

    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.once("error", reject);
    child.once("exit", (code) => (code === 0 ? resolve(output) : reject(new Error(output))));
  });
}

/** Fetches a path and returns the raw response, status line and headers included. */
function curl(pathname) {
  return run("curl.exe", ["-sS", "-i", `${origin}${pathname}`]);
}

function statusOf(response) {
  return response.match(/^HTTP\/[^ ]+ (\d+)/m)?.[1] ?? "unknown";
}

function headerOf(response, name) {
  return response.match(new RegExp(`^${name}:\\s*([^\\r\\n]+)`, "im"))?.[1] ?? "";
}

function startWrangler() {
  const server = spawn("cmd.exe", ["/c", `pnpm exec wrangler dev --local --port ${port}`], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let startup = "";

  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Wrangler did not start:\n${startup}`));
    }, startupTimeoutMs);

    const check = (chunk) => {
      startup += chunk;
      if (/Ready on/.test(startup)) {
        clearTimeout(timer);
        resolve();
      }
    };

    server.stdout.on("data", check);
    server.stderr.on("data", check);
    server.once("error", reject);
  });

  return { server, ready };
}

// dist/_headers is generated, not authored, so nothing in the build fails if the generator silently
// stops emitting a directive. The promises it makes are asserted here against a server that applies
// them, including the inline-script hashes without which the pre-paint theme script is blocked.
function assertHeaders(document, asset, assetPath) {
  for (const [name, expected] of requiredDocumentHeaders) {
    if (!expected.test(headerOf(document, name))) {
      throw new Error(`The document is missing ${name}. dist/_headers did not apply.`);
    }
  }

  const policy = headerOf(document, "content-security-policy");
  const hashes = policy.match(/'sha256-[^']+'/g) ?? [];
  if (hashes.length === 0) {
    throw new Error("The CSP carries no inline-script hashes; the pre-paint theme script would be blocked.");
  }

  const assetCaching = headerOf(asset, "cache-control");
  if (!/immutable/.test(assetCaching)) {
    throw new Error(`Hashed asset ${assetPath} is not immutable: ${assetCaching || "(no cache-control)"}`);
  }

  if (/immutable/.test(headerOf(document, "cache-control"))) {
    throw new Error("The document must stay revalidated, never immutable.");
  }

  return hashes.length;
}

const { server, ready } = startWrangler();

try {
  await ready;

  const root = await curl("/");
  const assetPath = root.match(/\/_astro\/[A-Za-z0-9.\-_]+\.js/)?.[0];
  if (!assetPath) {
    throw new Error("Could not find a hashed asset in the document to check caching against.");
  }

  const [missing, asset] = await Promise.all([curl("/no-such-page"), curl(assetPath)]);

  if (statusOf(root) !== "200" || !/<html/i.test(root)) {
    throw new Error(`The root did not serve the page (status ${statusOf(root)}).`);
  }
  if (statusOf(missing) !== "404") {
    throw new Error(`A missing path returned ${statusOf(missing)}, expected the 404 page.`);
  }

  const hashCount = assertHeaders(root, asset, assetPath);

  console.log(
    [
      "root: 200",
      "missing path: 404 page",
      `CSP with ${hashCount} inline-script hashes + security headers`,
      `${assetPath} immutable`,
    ].join("; "),
  );
} finally {
  await run("taskkill", ["/PID", String(server.pid), "/T", "/F"]);
}
