import { bindNearestNodeTouchRouter } from "./touch-router";
import type { AtlasRoute, NormalizedTelemetry, PopCode } from "./types";

export interface AtlasView {
  bindTooltips(): () => void;
  markHot(code: string | null): void;
  setRoute(code: PopCode): number;
  setRouteProgress(length: number, progress: number): void;
  setPulseOpacity(opacity: number): void;
  setRouteVisible(visible: boolean): void;
  renderRoute(route: AtlasRoute, telemetry: NormalizedTelemetry | null): void;
}

interface AtlasDom {
  frame: HTMLElement;
  svg: SVGSVGElement;
  routePath: SVGPathElement;
  pulse: SVGCircleElement;
  readout: HTMLElement;
  tip: HTMLElement | null;
  nodes: SVGGElement[];
}

function appendText(parent: Node, text: string): void {
  parent.appendChild(document.createTextNode(text));
}

function appendStrong(parent: Node, text: string, className?: string): void {
  const strong = document.createElement("b");
  if (className) strong.className = className;
  strong.textContent = text;
  parent.appendChild(strong);
}

function renderMeasured(readout: HTMLElement, telemetry: NormalizedTelemetry, routeCode?: PopCode): void {
  readout.replaceChildren();
  if (routeCode) {
    appendText(readout, "route: ");
    appendStrong(readout, routeCode);
    appendText(readout, " → you · ");
  }
  const bits: Node[] = [];
  if (telemetry.colo) {
    const fragment = document.createDocumentFragment();
    appendText(fragment, "colo: ");
    appendStrong(fragment, telemetry.colo);
    bits.push(fragment);
  }
  if (telemetry.ttfbMs !== undefined) {
    const fragment = document.createDocumentFragment();
    appendText(fragment, "ttfb ");
    appendStrong(fragment, `${telemetry.ttfbMs}ms`);
    bits.push(fragment);
  }
  if (telemetry.pageKb !== undefined) {
    const fragment = document.createDocumentFragment();
    appendText(fragment, "page ");
    appendStrong(fragment, `${telemetry.pageKb}kb`);
    bits.push(fragment);
  }
  bits.forEach((bit, index) => {
    if (index > 0) appendText(readout, " · ");
    readout.appendChild(bit);
  });
  appendText(readout, bits.length ? " · " : "");
  const measured = document.createElement("span");
  measured.className = "hit";
  measured.textContent = "measured";
  readout.appendChild(measured);
}

function renderSynthetic(readout: HTMLElement, route: AtlasRoute): void {
  readout.replaceChildren();
  appendText(readout, "route: ");
  appendStrong(readout, route.code);
  appendText(readout, " → client · ttfb ");
  appendStrong(readout, `${route.ttfb}ms`);
  appendText(readout, " · cache: ");
  if (route.hit) {
    const hit = document.createElement("span");
    hit.className = "hit";
    hit.textContent = "HIT";
    readout.appendChild(hit);
  } else {
    appendStrong(readout, "MISS");
  }
}

function queryDom(frame: HTMLElement): AtlasDom | null {
  const svg = frame.querySelector<SVGSVGElement>("[data-atlas-svg]");
  const routePath = frame.querySelector<SVGPathElement>("[data-route]");
  const pulse = frame.querySelector<SVGCircleElement>("[data-pulse]");
  const readout = frame.querySelector<HTMLElement>("[data-readout-text]");
  if (!svg || !routePath || !pulse || !readout) return null;
  return {
    frame,
    svg,
    routePath,
    pulse,
    readout,
    tip: frame.querySelector<HTMLElement>("[data-atlas-tip]"),
    nodes: Array.from(svg.querySelectorAll<SVGGElement>(".node")),
  };
}

function showTip(dom: AtlasDom, node: SVGGElement): void {
  if (!dom.tip) return;
  const halo = node.querySelector("circle.halo");
  if (!halo) return;
  const nb = halo.getBoundingClientRect();
  const sb = dom.frame.getBoundingClientRect();
  const title = document.createElement("b");
  title.textContent = node.dataset.city ?? "Edge node";
  const role = node.dataset.role;
  if (role) {
    const sub = document.createElement("span");
    sub.className = "r";
    sub.textContent = ` · ${role}`;
    dom.tip.replaceChildren(title, sub);
  } else {
    dom.tip.replaceChildren(title);
  }
  dom.tip.style.left = `${nb.left - sb.left + nb.width / 2}px`;
  dom.tip.style.top = `${nb.top - sb.top}px`;
  dom.tip.classList.add("show");
  dom.tip.setAttribute("aria-hidden", "false");
}
function hideTip(dom: AtlasDom): void {
  dom.tip?.classList.remove("show");
  dom.tip?.setAttribute("aria-hidden", "true");
}
function bindNodeTooltips(dom: AtlasDom): () => void {
  const removers: Array<() => void> = [];
  let pinnedNode: SVGGElement | null = null;
  const setPinnedNode = (node: SVGGElement | null): void => {
    if (pinnedNode === node) {
      if (!node) hideTip(dom);
      return;
    }
    pinnedNode?.classList.remove("tip-pinned");
    pinnedNode?.setAttribute("aria-pressed", "false");
    pinnedNode = node;
    if (!node) return hideTip(dom);
    node.classList.add("tip-pinned");
    node.setAttribute("aria-pressed", "true");
    showTip(dom, node);
  };
  const toggleNode = (node: SVGGElement): void => setPinnedNode(pinnedNode === node ? null : node);

  for (const node of dom.nodes) {
    node.setAttribute("aria-pressed", "false");
    node.setAttribute("aria-describedby", "atlas-tip");
    const enter = () => !pinnedNode && showTip(dom, node);
    const leave = () => !pinnedNode && hideTip(dom);
    const focus = () => {
      if (pinnedNode && pinnedNode !== node) setPinnedNode(null);
      showTip(dom, node);
    };
    const blur = () => pinnedNode !== node && hideTip(dom);
    const keyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleNode(node);
    };
    const accessibleClick = (event: MouseEvent) => event.detail === 0 && toggleNode(node);
    node.addEventListener("mouseenter", enter);
    node.addEventListener("mouseleave", leave);
    node.addEventListener("focus", focus);
    node.addEventListener("blur", blur);
    node.addEventListener("keydown", keyDown);
    node.addEventListener("click", accessibleClick);
    removers.push(() => {
      node.removeEventListener("mouseenter", enter);
      node.removeEventListener("mouseleave", leave);
      node.removeEventListener("focus", focus);
      node.removeEventListener("blur", blur);
      node.removeEventListener("keydown", keyDown);
      node.removeEventListener("click", accessibleClick);
    });
  }

  const unbindTouchRouter = bindNearestNodeTouchRouter({
    nodes: dom.nodes,
    onSelect: (node) => {
      node.focus({ preventScroll: true });
      toggleNode(node);
    },
    svg: dom.svg,
  });

  const dismissOnPointerDown = (event: PointerEvent) => {
    if (!pinnedNode || !(event.target instanceof Node) || pinnedNode.contains(event.target)) return;
    setPinnedNode(null);
  };
  const dismissOnEscape = (event: KeyboardEvent) => event.key === "Escape" && pinnedNode && setPinnedNode(null);
  document.addEventListener("pointerdown", dismissOnPointerDown);
  document.addEventListener("keydown", dismissOnEscape);

  return () => {
    setPinnedNode(null);
    unbindTouchRouter();
    document.removeEventListener("pointerdown", dismissOnPointerDown);
    document.removeEventListener("keydown", dismissOnEscape);
    removers.forEach((remove) => remove());
  };
}

export function createView(frame: HTMLElement): AtlasView | null {
  const dom = queryDom(frame);
  if (!dom) return null;
  const spokeFor = (code: PopCode): string => dom.svg.querySelector(`#sp-${code}`)?.getAttribute("d") ?? "";

  return {
    bindTooltips: () => bindNodeTooltips(dom),
    markHot: (code) => {
      for (const node of dom.nodes) {
        node.classList.toggle("hot", node.dataset.code === code);
      }
    },
    setRoute: (code) => {
      dom.routePath.setAttribute("d", spokeFor(code));
      dom.routePath.classList.add("on");
      return dom.routePath.getTotalLength();
    },
    setRouteProgress: (length, progress) => {
      const len = progress * length;
      dom.routePath.style.strokeDasharray = `${len} ${length}`;
      const point = dom.routePath.getPointAtLength(len);
      dom.pulse.setAttribute("cx", String(point.x));
      dom.pulse.setAttribute("cy", String(point.y));
    },
    setPulseOpacity: (opacity) => {
      dom.pulse.style.opacity = String(opacity);
    },
    setRouteVisible: (visible) => {
      dom.routePath.classList.toggle("on", visible);
    },
    renderRoute: (route, telemetry) => {
      if (route.telemetry) renderMeasured(dom.readout, route.telemetry, route.code);
      else if (route.showMeasuredLine && telemetry) renderMeasured(dom.readout, telemetry);
      else renderSynthetic(dom.readout, route);
    },
  };
}
