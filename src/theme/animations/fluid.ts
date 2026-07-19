export interface LiquidProfile {
  id: "desktop" | "mobile";
  columns: number;
  frames: number;
  duration: number;
  amplitude: number;
}

export const PROFILES: Record<LiquidProfile["id"], LiquidProfile> = {
  desktop: {
    id: "desktop",
    columns: 32,
    frames: 14,
    duration: 680,
    amplitude: 1,
  },
  mobile: {
    id: "mobile",
    columns: 20,
    frames: 10,
    duration: 620,
    amplitude: 0.84,
  },
};

const keyframeCache = new Map<LiquidProfile["id"], Keyframe[]>();

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

export function smoothstep(value: number): number {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

export function gaussian(x: number, center: number, width: number): number {
  return Math.exp(-(((x - center) / width) ** 2));
}

export function pulse(progress: number, start: number, end: number): number {
  return Math.sin(Math.PI * clamp((progress - start) / (end - start), 0, 1));
}

export function liquidPolygon(progress: number, profile: LiquidProfile): string {
  const base = -7 + smoothstep(progress) * 116;
  const env = Math.sin(Math.PI * progress) * profile.amplitude;
  const points = ["0% 0%", "100% 0%"];
  for (let i = profile.columns; i >= 0; i -= 1) {
    const x = i / profile.columns;
    const waves =
      Math.sin(x * Math.PI * 3.1 + progress * 8.4) * 2.8 +
      Math.sin(x * Math.PI * 7.3 - progress * 5.7) * 1.3 +
      Math.sin(x * Math.PI * 13 + progress * 3.1) * 0.55;
    const drops =
      (gaussian(x, 0.18, 0.055) * 11 * pulse(progress, 0.07, 0.61) +
        gaussian(x, 0.51, 0.038) * 17 * pulse(progress, 0.18, 0.77) +
        gaussian(x, 0.82, 0.066) * 10 * pulse(progress, 0.03, 0.55) -
        gaussian(x, 0.34, 0.08) * 5 * pulse(progress, 0.24, 0.72)) *
      profile.amplitude;
    const y = clamp(base + waves * env + drops, 0, 112);
    points.push(`${(x * 100).toFixed(1)}% ${y.toFixed(1)}%`);
  }
  return `polygon(${points.join(",")})`;
}

export function getLiquidKeyframes(profile: LiquidProfile): Keyframe[] {
  const cached = keyframeCache.get(profile.id);
  if (cached) return cached;
  const frames = Array.from({ length: profile.frames }, (_, index) => {
    const offset = index / (profile.frames - 1);
    return { clipPath: liquidPolygon(offset, profile), offset };
  });
  keyframeCache.set(profile.id, frames);
  return frames;
}

export function selectProfile(width: number): LiquidProfile {
  return width < 768 ? PROFILES.mobile : PROFILES.desktop;
}

export function animateFluid(root: HTMLElement, width: number): Animation {
  const profile = selectProfile(width);
  return root.animate(getLiquidKeyframes(profile), {
    duration: profile.duration,
    easing: "linear",
    fill: "both",
    pseudoElement: "::view-transition-new(root)",
  });
}
