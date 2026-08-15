import { initTyper, type TyperHandle } from "../typer";
import type { ShellAction, ShellConfig, ShellHandle } from "./types";
import { createShellView, type ShellView } from "./view";

const ANSWER_SPEED = { typeMs: 14, jitterMs: 10 };
const READ_HOLD_MS = 10_000;

function actionText(action: Extract<ShellAction, { type: "say" }>): string {
  return typeof action.text === "function" ? action.text() : action.text;
}

export function initShell(root: HTMLElement, config: ShellConfig): ShellHandle {
  let input: HTMLInputElement | null = null;
  let answerTyper: TyperHandle | null = null;
  let resumeTimer = 0;

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
    } else if (action.type === "run") {
      const result = action.fn();
      if (typeof result === "string") answer(result);
      else config.resumeAmbient();
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
