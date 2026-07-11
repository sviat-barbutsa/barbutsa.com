/// <reference types="astro/client" />

// Safety net if the TS DOM lib predates View Transitions (theme plan §4).
interface Navigator {
  readonly deviceMemory?: number;
}
