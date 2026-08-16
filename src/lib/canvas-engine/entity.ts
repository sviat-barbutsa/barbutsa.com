/**
 * canvas-engine/entity - component model for canvas scenes.
 *
 * An Entity is a small unit with a uniform lifecycle, basically a UI
 * component for the canvas. Scenes are built by adding entities to an
 * Engine (or EntityGroup) instead of writing one giant draw().
 */

export interface FrameInfo {
  /** Seconds since last frame (clamped - see engine). */
  dt: number;
  /** Seconds since the engine started. */
  elapsed: number;
  /** Canvas CSS-pixel size (already DPR-normalized for drawing). */
  width: number;
  height: number;
  /** Resolved theme tokens for this frame. */
  tokens: Record<string, string>;
  /** True when prefers-reduced-motion - draw a static frame. */
  reducedMotion: boolean;
}

export interface Entity {
  /** Advance internal state. Keep pure-ish; no DOM access here. */
  update(frame: FrameInfo): void;
  /** Paint. Assume ctx is already DPR-scaled to CSS pixels. */
  draw(ctx: CanvasRenderingContext2D, frame: FrameInfo): void;
}

/** Ordered container so sub-scenes can be composed like fragments. */
export class EntityGroup implements Entity {
  private entities: Entity[] = [];

  add<T extends Entity>(entity: T): T {
    this.entities.push(entity);
    return entity;
  }

  remove(entity: Entity): void {
    const i = this.entities.indexOf(entity);
    if (i !== -1) this.entities.splice(i, 1);
  }

  update(frame: FrameInfo): void {
    for (const e of this.entities) e.update(frame);
  }

  draw(ctx: CanvasRenderingContext2D, frame: FrameInfo): void {
    for (const e of this.entities) e.draw(ctx, frame);
  }
}
