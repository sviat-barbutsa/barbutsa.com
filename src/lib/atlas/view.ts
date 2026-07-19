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

export function createView(frame: HTMLElement): AtlasView | null {
  const dom = queryDom(frame);
  if (!dom) return null;

  const spokeFor = (code: PopCode): string => dom.svg.querySelector(`#sp-${code}`)?.getAttribute("d") ?? "";

  const showTip = (node: SVGGElement): void => {
    if (!dom.tip) return;
    const halo = node.querySelector("circle.halo");
    if (!halo) return;
    const nb = halo.getBoundingClientRect();
    const sb = dom.frame.getBoundingClientRect();
    const city = node.dataset.city ?? "Edge node";
    const role = node.dataset.role ?? "network point";
    const title = document.createElement("b");
    const sub = document.createElement("span");
    sub.className = "r";
    title.textContent = city;
    sub.textContent = ` · ${role}`;
    dom.tip.replaceChildren(title, sub);
    dom.tip.style.left = `${nb.left - sb.left + nb.width / 2}px`;
    dom.tip.style.top = `${nb.top - sb.top}px`;
    dom.tip.classList.add("show");
    dom.tip.setAttribute("aria-hidden", "false");
  };

  const hideTip = (): void => {
    if (!dom.tip) return;
    dom.tip.classList.remove("show");
    dom.tip.setAttribute("aria-hidden", "true");
  };

  return {
    bindTooltips: () => {
      const removers: Array<() => void> = [];
      for (const node of dom.nodes) {
        const enter = () => showTip(node);
        node.addEventListener("mouseenter", enter);
        node.addEventListener("mouseleave", hideTip);
        node.addEventListener("focus", enter);
        node.addEventListener("blur", hideTip);
        removers.push(() => {
          node.removeEventListener("mouseenter", enter);
          node.removeEventListener("mouseleave", hideTip);
          node.removeEventListener("focus", enter);
          node.removeEventListener("blur", hideTip);
        });
      }
      return () => {
        hideTip();
        removers.forEach((remove) => remove());
      };
    },
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
