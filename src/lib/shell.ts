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

const ANSWER_SPEED = { typeMs: 14, jitterMs: 10, holdMs: 6000, blinkMs: 400 };

export function initShell(root: HTMLElement, config: ShellConfig): void {
  const live = root.querySelector<HTMLElement>("[data-typer-text]");
  const caret = root.querySelector<HTMLElement>(".caret");
  if (!live) return;

  let input: HTMLInputElement | null = null;
  let answerTyper: TyperHandle | null = null;

  root.setAttribute("tabindex", "0");
  root.setAttribute("role", "button");
  root.setAttribute(
    "aria-label",
    'Site command line — press Enter to activate, then type "help"',
  );
  root.removeAttribute("aria-hidden");
  root.style.cursor = "text";

  const answer = (text: string): void => {
    answerTyper?.destroy();
    live.textContent = "";
    answerTyper = initTyper(live, [text], ANSWER_SPEED);
    config.announce?.(text);
    /* resume ambient rotation after the answer has been read */
    window.setTimeout(() => {
      answerTyper?.destroy();
      answerTyper = null;
      config.resumeAmbient();
    }, ANSWER_SPEED.holdMs + text.length * ANSWER_SPEED.typeMs + 800);
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
    if (runValue !== undefined) execute(runValue);
    else config.resumeAmbient();
  };

  const open = (): void => {
    if (input) return;
    config.suspendAmbient();
    answerTyper?.destroy();
    answerTyper = null;
    live.textContent = "";
    live.hidden = true;
    if (caret) caret.hidden = true;

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
      }
    });
    input.addEventListener("blur", () => close());
  };

  root.addEventListener("click", (e) => {
    if (e.target !== input) open();
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !input) {
      e.preventDefault();
      open();
    }
  });
}
