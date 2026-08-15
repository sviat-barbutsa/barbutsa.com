/// <reference types="astro/client" />

// safety net if the TS DOM lib predates View Transitions
interface Navigator {
  readonly deviceMemory?: number;
}
