/**
 * Checks the built site against a real local Workers static-asset server (not
 * Astro's preview server), so the deploy config is actually exercised:
 *
 *   - the root serves the page
 *   - a missing path returns the styled 404, because not_found_handling is "404-page"
 *   - dist/_headers really applies: the generated CSP and the security headers on the document,
 *     immutable caching on hashed assets, and no immutable caching on the document
 *
 * Runs on Windows, Linux, and macOS: requests go through Node's fetch, and the
 * wrangler process is stopped by process group (POSIX) or taskkill (Windows).
 */

import { spawn } from "node:child_process";

const port = process.env.WRANGLER_LOCAL_PORT ?? "8789";
const origin = `http://127.0.0.1:${port}`;
const startupTimeoutMs = 90_000;
const isWindows = process.platform === "win32";

/** every document response must have these - they can only come from dist/_headers */
const requiredDocumentHeaders = [
  ["content-security-policy", /default-src 'self'/],
  ["referrer-policy", /no-referrer/],
  ["x-content-type-options", /nosniff/],
  ["x-frame-options", /DENY/],
  ["cross-origin-opener-policy", /same-origin/],
];

/** Fetches a path; returns status, lower-cased headers, and body text. */
async function get(pathname) {
  const response = await fetch(`${origin}${pathname}`, { redirect: "manual" });
  const headers = {};
  response.headers.forEach((value, name) => {
    headers[name.toLowerCase()] = value;
  });
  return { status: response.status, headers, body: await response.text() };
}

function startWrangler() {
  const options = {
    stdio: ["ignore", "pipe", "pipe"],
    // own process group on POSIX so the whole tree can be signalled at the end
    detached: !isWindows,
    env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "1", NO_COLOR: "1" },
  };
  const server = isWindows
    ? // pnpm is a .cmd shim on Windows, so it needs a shell; one string avoids the shell-args deprecation
      spawn(`pnpm exec wrangler dev --local --port ${port}`, { ...options, shell: true })
    : spawn("pnpm", ["exec", "wrangler", "dev", "--local", "--port", port], options);

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
    server.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    server.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Wrangler exited early (code ${code}):\n${startup}`));
    });
  });

  return { server, ready };
}

function stopWrangler(server) {
  if (server.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    server.once("exit", resolve);
    if (isWindows) {
      const taskkill = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\taskkill.exe`;
      spawn(taskkill, ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" })
        .once("error", resolve)
        .once("exit", resolve);
    } else {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        server.kill("SIGTERM");
      }
      setTimeout(() => {
        try {
          process.kill(-server.pid, "SIGKILL");
        } catch {
          /* already gone */
        }
        resolve();
      }, 5_000).unref();
    }
  });
}

// dist/_headers is generated, not authored, so nothing in the build fails if the generator silently
// stops emitting a directive. The promises it makes are asserted here against a server that applies
// them, including the inline-script hashes without which the pre-paint theme script is blocked.
function assertHeaders(document, asset, assetPath) {
  for (const [name, expected] of requiredDocumentHeaders) {
    if (!expected.test(document.headers[name] ?? "")) {
      throw new Error(`The document is missing ${name}. dist/_headers did not apply.`);
    }
  }

  const policy = document.headers["content-security-policy"] ?? "";
  const hashes = policy.match(/'sha256-[^']+'/g) ?? [];
  if (hashes.length === 0) {
    throw new Error("The CSP carries no inline-script hashes; the pre-paint theme script would be blocked.");
  }

  const assetCaching = asset.headers["cache-control"] ?? "";
  if (!/immutable/.test(assetCaching)) {
    throw new Error(`Hashed asset ${assetPath} is not immutable: ${assetCaching || "(no cache-control)"}`);
  }

  if (/immutable/.test(document.headers["cache-control"] ?? "")) {
    throw new Error("The document must stay revalidated, never immutable.");
  }

  return hashes.length;
}

const { server, ready } = startWrangler();

try {
  await ready;

  const root = await get("/");
  const assetPath = root.body.match(/\/_astro\/[A-Za-z0-9.\-_]+\.js/)?.[0];
  if (!assetPath) {
    throw new Error("Could not find a hashed asset in the document to check caching against.");
  }

  const [missing, asset] = await Promise.all([get("/no-such-page"), get(assetPath)]);

  if (root.status !== 200 || !/<html/i.test(root.body)) {
    throw new Error(`The root did not serve the page (status ${root.status}).`);
  }
  if (missing.status !== 404) {
    throw new Error(`A missing path returned ${missing.status}, expected the 404 page.`);
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
  await stopWrangler(server);
}
