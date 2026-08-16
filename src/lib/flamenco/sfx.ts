/**
 * flamenco/sfx - tiny WebAudio synth for the packet runner. No audio
 * files: every sound is an oscillator with a gain envelope, ~free.
 * The AudioContext is created lazily on first play - always after a
 * user gesture (the game itself opens via a typed command), so
 * autoplay policies are never an issue.
 */

const STORE_KEY = "flamenco-snd";

let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = sessionStorage.getItem(STORE_KEY) === "off";
} catch {
  /* optional */
}

function ensureCtx(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** One enveloped note. Frequencies in Hz, times in seconds. */
function note(
  freq: number,
  duration: number,
  {
    type = "triangle" as OscillatorType,
    gain = 0.05,
    delay = 0,
    slideTo,
  }: {
    type?: OscillatorType;
    gain?: number;
    delay?: number;
    slideTo?: number;
  } = {},
): void {
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0004, t0 + duration);
  osc.connect(env).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  /** the packet leaves the ground */
  jump(): void {
    note(300, 0.09, { slideTo: 520, gain: 0.045 });
  },
  /** an obstacle cleared - cache HIT tick */
  clear(): void {
    note(880, 0.05, { type: "sine", gain: 0.035 });
  },
  /** collision - dry descending sting */
  die(): void {
    note(220, 0.16, { type: "sawtooth", slideTo: 82, gain: 0.05 });
    note(110, 0.22, { type: "sawtooth", slideTo: 55, gain: 0.04, delay: 0.12 });
  },
  /** every 1000ms-saved milestone - three rising notes, a little olé */
  milestone(): void {
    note(660, 0.07, { type: "square", gain: 0.03 });
    note(880, 0.07, { type: "square", gain: 0.03, delay: 0.08 });
    note(1100, 0.1, { type: "square", gain: 0.035, delay: 0.16 });
  },
};

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  try {
    sessionStorage.setItem(STORE_KEY, muted ? "off" : "on");
  } catch {
    /* optional */
  }
  return muted;
}

export function closeSfx(): void {
  void ctx?.close();
  ctx = null;
}
