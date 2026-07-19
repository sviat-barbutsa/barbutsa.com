export interface RadialOrigin {
  x: number;
  y: number;
}

export function radialOrigin(event: MouseEvent | undefined, trigger: HTMLElement): RadialOrigin {
  const rect = trigger.getBoundingClientRect();
  const keyboard = !event || event.detail === 0 || (event.clientX === 0 && event.clientY === 0);
  return {
    x: keyboard ? rect.left + rect.width / 2 : event.clientX,
    y: keyboard ? rect.top + rect.height / 2 : event.clientY,
  };
}

export function coveringRadius(origin: RadialOrigin, width: number, height: number): number {
  return Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y)) + 2;
}

export function animateRadial(
  root: HTMLElement,
  event: MouseEvent | undefined,
  trigger: HTMLElement,
  viewport: { width: number; height: number },
): Animation {
  const origin = radialOrigin(event, trigger);
  const radius = coveringRadius(origin, viewport.width, viewport.height);
  return root.animate(
    {
      clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`],
    },
    {
      duration: viewport.width < 768 ? 540 : 620,
      easing: "cubic-bezier(.16, 1, .3, 1)",
      fill: "both",
      pseudoElement: "::view-transition-new(root)",
    },
  );
}
