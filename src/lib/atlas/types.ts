import type { Telemetry } from "../telemetry-core";

export type PopCode = "WAW" | "FRA" | "AMS" | "LHR" | "DXB" | "IAD" | "NRT" | "SIN" | "GRU" | "JNB" | "SYD";

export interface AtlasHandle {
  destroy(): void;
  setTelemetry(t: Telemetry | null): void;
}

export interface NormalizedTelemetry {
  colo?: string;
  loc?: string;
  mappedColo?: PopCode;
  ttfbMs?: number;
  pageKb?: number;
}

export interface AtlasRoute {
  code: PopCode;
  ttfb: number;
  hit: boolean;
  telemetry?: NormalizedTelemetry;
  showMeasuredLine: boolean;
}
