export class MenuSelection {
  private selected = -1;

  constructor(private buttons: HTMLButtonElement[]) {}

  select(index: number, focus = true): void {
    if (this.buttons.length === 0) return;
    this.selected = ((index % this.buttons.length) + this.buttons.length) % this.buttons.length;
    this.buttons.forEach((button, buttonIndex) => {
      button.toggleAttribute("data-fl-selected", buttonIndex === this.selected);
    });
    if (focus) this.buttons[this.selected]?.focus();
  }

  clear(): void {
    this.selected = -1;
    this.buttons.forEach((button) => button.removeAttribute("data-fl-selected"));
  }

  move(direction: 1 | -1): void {
    this.select(this.selected === -1 ? (direction === 1 ? 0 : this.buttons.length - 1) : this.selected + direction);
  }

  activate(): void {
    if (this.selected !== -1) this.buttons[this.selected]?.click();
  }
}
