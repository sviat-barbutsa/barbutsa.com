import type { Telemetry } from "../telemetry-core";
import { createActivityGate } from "../runtime/activity-gate";
import { prefersReducedMotion } from "../runtime/reduced-motion";
import { registerPausable } from "../runtime/pause-registry";
import { chooseNextRoute, createRouteState, normalizeTelemetry, setRouteTelemetry, staticRoute } from "./model";
import { RouteAnimator } from "./route-animator";
import type { AtlasHandle, AtlasRoute, NormalizedTelemetry } from "./types";
import { createView } from "./view";
import type { AtlasView } from "./view";

const FRAME_HANDLE = Symbol.for("personal-atlas.atlas-handle");

type AtlasFrame = HTMLElement & {
  [FRAME_HANDLE]?: AtlasHandle;
};

function noopHandle(): AtlasHandle {
  return {
    destroy: () => {},
    setTelemetry: () => {},
  };
}

export function renderStaticAtlasRoute(
  view: AtlasView,
  route: AtlasRoute,
  telemetry: NormalizedTelemetry | null,
): void {
  const routeLength = view.setRoute(route.code);
  view.setRouteProgress(routeLength, 1);
  view.setPulseOpacity(0);
  view.markHot(route.code);
  view.renderRoute(route, telemetry);
}

export function initAtlas(frame: HTMLElement): AtlasHandle {
  const atlasFrame = frame as AtlasFrame;
  if (atlasFrame[FRAME_HANDLE]) return atlasFrame[FRAME_HANDLE];

  const view = createView(frame);
  if (!view) return noopHandle();

  const cleanupTooltips = view.bindTooltips();
  const reduced = prefersReducedMotion();
  let telemetry: NormalizedTelemetry | null = null;

  if (reduced) {
    const renderStatic = (): void => {
      const route = staticRoute(telemetry?.mappedColo ?? "WAW", telemetry);
      renderStaticAtlasRoute(view, route, telemetry);
    };
    renderStatic();
    let destroyed = false;
    const handle: AtlasHandle = {
      destroy: () => {
        if (destroyed) return;
        destroyed = true;
        cleanupTooltips();
        if (atlasFrame[FRAME_HANDLE] === handle) delete atlasFrame[FRAME_HANDLE];
      },
      setTelemetry: (next) => {
        telemetry = normalizeTelemetry(next);
        renderStatic();
      },
    };
    atlasFrame[FRAME_HANDLE] = handle;
    return handle;
  }

  const state = createRouteState();
  const animator = new RouteAnimator({
    view,
    nextRoute: () => chooseNextRoute(state),
    getTelemetryRoute: () => state.telemetry,
  });
  const activity = createActivityGate({
    target: frame,
    rootMargin: "64px",
    onActiveChange: (active) => {
      if (active) animator.resume();
      else animator.pause();
    },
  });
  const unregister = registerPausable({
    pause: () => activity.pause(),
    resume: () => activity.resume(),
    refreshTheme: () => {},
  });
  let destroyed = false;

  const handle: AtlasHandle = {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      animator.destroy();
      activity.destroy();
      cleanupTooltips();
      unregister();
      if (atlasFrame[FRAME_HANDLE] === handle) delete atlasFrame[FRAME_HANDLE];
    },
    setTelemetry: (next: Telemetry | null) => {
      setRouteTelemetry(state, next);
      telemetry = state.telemetry;
    },
  };
  atlasFrame[FRAME_HANDLE] = handle;
  return handle;
}
