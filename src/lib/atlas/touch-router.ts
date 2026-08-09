interface TouchRouterOptions {
  maxDistance?: number;
  nodes: readonly SVGGElement[];
  onSelect: (node: SVGGElement) => void;
  svg: SVGSVGElement;
}

function addTapTarget(node: SVGGElement): SVGCircleElement | null {
  const halo = node.querySelector<SVGCircleElement>("circle.halo");
  if (!halo) return null;
  const target = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  target.classList.add("tap-target");
  target.setAttribute("cx", halo.getAttribute("cx") ?? "0");
  target.setAttribute("cy", halo.getAttribute("cy") ?? "0");
  target.setAttribute("r", "1");
  target.setAttribute("aria-hidden", "true");
  node.insertBefore(target, halo);
  return target;
}

function nearestNodeAt(
  nodes: readonly SVGGElement[],
  clientX: number,
  clientY: number,
  maxDistance: number,
): SVGGElement | null {
  let nearestNode: SVGGElement | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const node of nodes) {
    const halo = node.querySelector<SVGCircleElement>("circle.halo");
    if (!halo) continue;
    const bounds = halo.getBoundingClientRect();
    const distance = Math.hypot(clientX - (bounds.left + bounds.width / 2), clientY - (bounds.top + bounds.height / 2));
    if (distance >= nearestDistance) continue;
    nearestNode = node;
    nearestDistance = distance;
  }
  return nearestDistance <= maxDistance ? nearestNode : null;
}

export function bindNearestNodeTouchRouter({ maxDistance = 24, nodes, onSelect, svg }: TouchRouterOptions): () => void {
  const pressedNodes = new Map<number, SVGGElement>();
  const targets = nodes.map(addTapTarget);
  const pointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse") return;
    const node = nearestNodeAt(nodes, event.clientX, event.clientY, maxDistance);
    if (!node) return;
    pressedNodes.set(event.pointerId, node);
    event.stopPropagation();
  };
  const pointerUp = (event: PointerEvent) => {
    if (event.pointerType === "mouse") return;
    const pressedNode = pressedNodes.get(event.pointerId);
    pressedNodes.delete(event.pointerId);
    if (!pressedNode || nearestNodeAt(nodes, event.clientX, event.clientY, maxDistance) !== pressedNode) return;
    event.stopPropagation();
    onSelect(pressedNode);
  };
  const pointerCancel = (event: PointerEvent) => pressedNodes.delete(event.pointerId);

  svg.addEventListener("pointerdown", pointerDown);
  svg.addEventListener("pointerup", pointerUp);
  svg.addEventListener("pointercancel", pointerCancel);

  return () => {
    pressedNodes.clear();
    svg.removeEventListener("pointerdown", pointerDown);
    svg.removeEventListener("pointerup", pointerUp);
    svg.removeEventListener("pointercancel", pointerCancel);
    targets.forEach((target) => target?.remove());
  };
}
