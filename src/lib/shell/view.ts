export interface ShellView {
  readonly live: HTMLElement;
  readonly srButton: HTMLButtonElement;
  updateMax(): void;
  clearLive(): void;
  follow(): void;
  unfollow(): void;
  enterInputMode(): HTMLInputElement | null;
  exitInputMode(): void;
  focusButton(): void;
  destroy(): void;
}

export function createShellView(root: HTMLElement, onButtonOpen: () => void): ShellView | null {
  const live = root.querySelector<HTMLElement>("[data-typer-text]");
  const liveBox = root.querySelector<HTMLElement>(".live");
  const caret = root.querySelector<HTMLElement>(".caret");
  if (!live) return null;

  const bounds = root.closest<HTMLElement>("[data-shell-bounds]") ?? root.parentElement;
  let follower: MutationObserver | null = null;
  let input: HTMLInputElement | null = null;

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

  root.setAttribute("aria-hidden", "true");
  root.style.cursor = "text";
  const srButton = document.createElement("button");
  srButton.type = "button";
  srButton.className = "shell-open-btn";
  srButton.textContent = 'Open site command line (type "help")';
  root.parentElement?.insertBefore(srButton, root);
  srButton.addEventListener("click", onButtonOpen);
  addEventListener("resize", updateMax, { passive: true });
  updateMax();

  return {
    live,
    srButton,
    updateMax,
    clearLive: () => {
      live.textContent = "";
    },
    follow,
    unfollow,
    enterInputMode: () => {
      if (input) return input;
      root.removeAttribute("aria-hidden");
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
      root.setAttribute("aria-hidden", "true");
      live.hidden = false;
      if (caret) caret.hidden = false;
      delete root.dataset.shellOpen;
      if (liveBox) liveBox.hidden = false;
    },
    focusButton: () => srButton.focus(),
    destroy: () => {
      removeEventListener("resize", updateMax);
      srButton.removeEventListener("click", onButtonOpen);
      srButton.remove();
      follower?.disconnect();
      input?.remove();
    },
  };
}
