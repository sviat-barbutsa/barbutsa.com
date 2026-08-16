import { initTyper, type TyperHandle } from "../typer";
import { resolveCommand } from "./commands";
import type { ShellAction, ShellConfig, ShellHandle, ShellRunResult } from "./types";
import { createShellView, type ShellView } from "./view";

const ANSWER_SPEED = { typeMs: 14, jitterMs: 10 };
const READ_HOLD_MS = 10_000;

function actionText(action: Extract<ShellAction, { type: "say" }>): string {
  return typeof action.text === "function" ? action.text() : action.text;
}

interface RunOutcome {
  /** the command produced text to type back */
  say: (text: string) => void;
  /** the command finished without text - the ambient line resumes */
  done: () => void;
  /** an async command rejected - answer instead of failing silently */
  fail: () => void;
  /** false once the shell was destroyed; late settlements are dropped */
  live: () => boolean;
}

/* Every run command settles through here, synchronous or not: text answers,
   nothing resumes the ambient line, and a rejected promise still answers
   instead of leaving an unhandled rejection and a silent shell. */
function settleRun(result: ShellRunResult | Promise<ShellRunResult>, outcome: RunOutcome): void {
  if (result instanceof Promise) {
    result.then(
      (value) => {
        if (outcome.live()) settleRun(value, outcome);
      },
      () => {
        if (outcome.live()) outcome.fail();
      },
    );
    return;
  }
  if (typeof result === "string") outcome.say(result);
  else outcome.done();
}

export function initShell(root: HTMLElement, config: ShellConfig): ShellHandle {
  let input: HTMLInputElement | null = null;
  let answerTyper: TyperHandle | null = null;
  let resumeTimer = 0;
  let disposed = false;

  const clearPending = (): void => {
    clearTimeout(resumeTimer);
    resumeTimer = 0;
    answerTyper?.destroy();
    answerTyper = null;
  };

  const open = (): void => {
    if (input) return;
    config.suspendAmbient();
    clearPending();
    view?.unfollow();
    view?.updateMax();
    view?.clearLive();
    input = view?.enterInputMode() ?? null;
    input?.addEventListener("keydown", onInputKey);
    input?.addEventListener("blur", onInputBlur);
  };

  const view: ShellView | null = createShellView(root, open);
  if (!view) return { destroy: () => {} };

  const answer = (text: string): void => {
    clearPending();
    view.clearLive();
    view.updateMax();
    view.follow();
    answerTyper = initTyper(view.live, [text], {
      ...ANSWER_SPEED,
      loop: false,
      onDone: () => {
        resumeTimer = window.setTimeout(() => {
          clearPending();
          view.unfollow();
          config.resumeAmbient();
        }, READ_HOLD_MS);
      },
    });
    config.announce?.(text);
  };

  const execute = (raw: string): void => {
    const resolved = resolveCommand(config.commands, raw);
    if (resolved.kind === "empty") {
      config.resumeAmbient();
      return;
    }
    if (resolved.kind === "not-found") {
      answer(`command not found: ${resolved.cmd} - try help`);
      return;
    }
    const { action, cmd } = resolved;
    if (action.type === "go") {
      location.href = action.href;
    } else if (action.type === "run") {
      settleRun(action.fn(), {
        say: answer,
        done: config.resumeAmbient,
        fail: () => answer(`${cmd}: unavailable right now - reload and try again`),
        live: () => !disposed,
      });
    } else {
      answer(actionText(action));
    }
  };

  const close = (runValue?: string): void => {
    if (!input) return;
    input.removeEventListener("keydown", onInputKey);
    input.removeEventListener("blur", onInputBlur);
    input = null;
    view.exitInputMode();
    if (runValue !== undefined) execute(runValue);
    else config.resumeAmbient();
  };

  function onInputKey(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.stopPropagation();
      close((event.target as HTMLInputElement).value);
    } else if (event.key === "Escape") {
      event.stopPropagation();
      close();
      view?.focusOpener();
    }
  }

  function onInputBlur(): void {
    close();
  }

  const onRootClick = (event: MouseEvent): void => {
    if (event.target !== input) open();
  };
  root.addEventListener("click", onRootClick);

  return {
    destroy: () => {
      disposed = true;
      clearPending();
      if (input) {
        input.removeEventListener("keydown", onInputKey);
        input.removeEventListener("blur", onInputBlur);
        input = null;
        view.exitInputMode();
      }
      root.removeEventListener("click", onRootClick);
      view.destroy();
    },
  };
}

export type { ShellAction, ShellConfig, ShellHandle };
