/**
 * shell — the typeline becomes a real single-line terminal
 * (INSTRUMENTS_PLAN §3). Commands either ACT (navigate, toggle) or
 * ANSWER by typing into the same line via the typer service. It never
 * grows beyond one line, so the ghost-cell sizing guarantee holds.
 *
 * Activation: click the line, or focus it and press Enter.
 * Exit: Escape, or blur. Doctrine rotation resumes afterwards.
 */

import { initTyper, type TyperHandle } from "./typer";

export type ShellAction =
  | { type: "say"; text: string | (() => string) }
  | { type: "go"; href: string }
  | { type: "run"; fn: () => string | void };

export interface ShellConfig {
  commands: Record<string, ShellAction>;
  /** Called to stop/restart the ambient doctrine rotation. */
  suspendAmbient: () => void;
  resumeAmbient: () => void;
  /** Optional live region for screen-reader answers. */
  announce?: (text: string) => void;
}

const ANSWER_SPEED = { typeMs: 14, jitterMs: 10 };
/** How long a finished answer stays readable before doctrine resumes. */
const READ_HOLD_MS = 10_000;

export function initShell(root: HTMLElement, config: ShellConfig): void {
  const live = root.querySelector<HTMLElement>("[data-typer-text]");
  const liveBox = root.querySelector<HTMLElement>(".live");
  const caret = root.querySelector<HTMLElement>(".caret");
  if (!live) return;

  let input: HTMLInputElement | null = null;
  let answerTyper: TyperHandle | null = null;
  let follower: MutationObserver | null = null;
  let resumeTimer = 0;

  /* One cancel point for EVERYTHING pending — called whenever the user
     takes over. Nothing can interrupt typing or reading after this. */
  const clearPending = (): void => {
    clearTimeout(resumeTimer);
    resumeTimer = 0;
    answerTyper?.destroy();
    answerTyper = null;
  };

  /* The overlay may grow down to the bottom of the bounds element
     ([data-shell-bounds], e.g. the hero grid) and no further — beyond
     that it scrolls. Recomputed on activation and resize. */
  const bounds = root.closest<HTMLElement>("[data-shell-bounds]") ?? root.parentElement;
  const updateMax = (): void => {
    if (!bounds || !liveBox) return;
    const max =
      bounds.getBoundingClientRect().bottom -
      liveBox.getBoundingClientRect().top;
    root.style.setProperty("--shell-max", `${Math.max(48, Math.round(max))}px`);
  };
  updateMax();
  addEventListener("resize", updateMax, { passive: true });

  /* keep the newest typed line visible inside the scrolling overlay */
  const follow = (): void => {
    follower?.disconnect();
    if (!liveBox) return;
    follower = new MutationObserver(() => {
      liveBox.scrollTop = liveBox.scrollHeight;
    });
    follower.observe(live, { childList: true, characterData: true, subtree: true });
  };
  const unfollow = (): void => {
    follower?.disconnect();
    follower = null;
    if (liveBox) liveBox.scrollTop = 0;
  };

  /* A11y pattern (axe label-content-name-mismatch): the typed line is
     DECORATIVE — its text changes constantly and can never match an
     accessible name. So the line stays aria-hidden, and keyboard/AT
     users get a real <button> instead (visually hidden until focused,
     like the skip link). Pointer users keep clicking the line. */
  root.setAttribute("aria-hidden", "true");
  root.style.cursor = "text";

  const srButton = document.createElement("button");
  srButton.type = "button";
  srButton.className = "shell-open-btn";
  srButton.textContent = 'Open site command line (type "help")';
  root.parentElement?.insertBefore(srButton, root);
  srButton.addEventListener("click", () => open());

  const answer = (text: string): void => {
    clearPending();
    live.textContent = "";
    updateMax();
    follow();
    /* loop:false — the answer types ONCE and stays (no erase cycle, no
       blink glitch). The read-hold starts from actual completion via
       onDone, never from an estimated timeout. */
    answerTyper = initTyper(live, [text], {
      ...ANSWER_SPEED,
      loop: false,
      onDone: () => {
        resumeTimer = window.setTimeout(() => {
          clearPending();
          unfollow();
          config.resumeAmbient();
        }, READ_HOLD_MS);
      },
    });
    config.announce?.(text);
  };

  const execute = (raw: string): void => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) {
      config.resumeAmbient();
      return;
    }
    const action = config.commands[cmd];
    if (!action) {
      answer(`command not found: ${cmd} — try help`);
      return;
    }
    if (action.type === "go") {
      location.href = action.href;
      return;
    }
    if (action.type === "run") {
      const result = action.fn();
      if (typeof result === "string") answer(result);
      else config.resumeAmbient();
      return;
    }
    answer(typeof action.text === "function" ? action.text() : action.text);
  };

  const close = (runValue?: string): void => {
    if (!input) return;
    /* Null the reference BEFORE removing: removal fires a blur event,
       whose handler calls close() again — the guard makes it a no-op. */
    const inp = input;
    input = null;
    inp.remove();
    live.hidden = false;
    if (caret) caret.hidden = false;
    delete root.dataset.shellOpen;
    if (liveBox) liveBox.hidden = false;
    if (runValue !== undefined) execute(runValue);
    else config.resumeAmbient();
  };

  const open = (): void => {
    if (input) return;
    config.suspendAmbient();
    clearPending(); /* cancels any read-hold — nothing fires while typing */
    unfollow();
    updateMax();
    live.textContent = "";
    live.hidden = true;
    if (caret) caret.hidden = true;
    /* the .live overlay is absolutely positioned ABOVE the in-flow
       input (z-index + background) — hide the whole box while the
       input is open or it swallows the keystrokes' pixels */
    root.dataset.shellOpen = "";
    if (liveBox) liveBox.hidden = true;

    input = document.createElement("input");
    input.type = "text";
    input.className = "shell-input";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "command");
    input.placeholder = "help";
    root.querySelector(".line")?.appendChild(input);
    input.focus();

    input.addEventListener("keydown", (e) => {
      /* Never let Enter/Escape bubble to the root's own keydown
         handler — it would see "no input open" (close() runs first)
         and immediately reopen an empty prompt over the answer. */
      if (e.key === "Enter") {
        e.stopPropagation();
        close((e.target as HTMLInputElement).value);
      } else if (e.key === "Escape") {
        e.stopPropagation();
        close();
        srButton.focus();
      }
    });
    input.addEventListener("blur", () => close());
  };

  root.addEventListener("click", (e) => {
    if (e.target !== input) open();
  });
}
