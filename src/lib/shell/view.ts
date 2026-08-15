export interface ShellView {
  readonly live: HTMLElement;
  updateMax(): void;
  clearLive(): void;
  follow(): void;
  unfollow(): void;
  enterInputMode(): HTMLInputElement | null;
  exitInputMode(): void;
  focusOpener(): void;
  destroy(): void;
}

export function createShellView(root: HTMLElement, onOpen: () => void): ShellView | null {
  const live = root.querySelector<HTMLElement>("[data-typer-text]");
  const liveBox = root.querySelector<HTMLElement>(".live");
  const caret = root.querySelector<HTMLElement>(".caret");
  if (!live) return null;

  const bounds = root.closest<HTMLElement>("[data-shell-bounds]") ?? root.parentElement;
  let follower: MutationObserver | null = null;
  let input: HTMLInputElement | null = null;
  const openerLabel = 'Open site command line (type "help")';

  const enterOpenerMode = (): void => {
    root.removeAttribute("aria-hidden");
    root.setAttribute("role", "button");
    root.setAttribute("aria-label", openerLabel);
    root.tabIndex = 0;
  };

  const exitOpenerMode = (): void => {
    root.removeAttribute("role");
    root.removeAttribute("aria-label");
    root.removeAttribute("tabindex");
  };

  const updateMax = (): void => {
    if (!bounds || !liveBox) return;
    const max = bounds.getBoundingClientRect().bottom - liveBox.getBoundingClientRect().top;
    root.style.setProperty("--shell-max", `${Math.max(48, Math.round(max))}px`);
  };

  const follow = (): void => {
    follower?.disconnect();
    if (!liveBox) return;
    follower = new MutationObserver(() => {
      liveBox.scrollTop = liveBox.scrollHeight;
    });
    follower.observe(live, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  };

  const unfollow = (): void => {
    follower?.disconnect();
    follower = null;
    if (liveBox) liveBox.scrollTop = 0;
  };

  root.style.cursor = "text";
  enterOpenerMode();
  const onOpenerKey = (event: KeyboardEvent): void => {
    if (event.target !== root || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onOpen();
  };
  root.addEventListener("keydown", onOpenerKey);
  addEventListener("resize", updateMax, { passive: true });
  updateMax();

  return {
    live,
    updateMax,
    clearLive: () => {
      live.textContent = "";
    },
    follow,
    unfollow,
    enterInputMode: () => {
      if (input) return input;
      exitOpenerMode();
      live.hidden = true;
      if (caret) caret.hidden = true;
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
      return input;
    },
    exitInputMode: () => {
      input?.remove();
      input = null;
      enterOpenerMode();
      live.hidden = false;
      if (caret) caret.hidden = false;
      delete root.dataset.shellOpen;
      if (liveBox) liveBox.hidden = false;
    },
    focusOpener: () => root.focus(),
    destroy: () => {
      removeEventListener("resize", updateMax);
      root.removeEventListener("keydown", onOpenerKey);
      exitOpenerMode();
      root.setAttribute("aria-hidden", "true");
      follower?.disconnect();
      input?.remove();
    },
  };
}
