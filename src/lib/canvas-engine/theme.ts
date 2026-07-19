/**
 * canvas-engine/theme — the canvas obeys the CSS token system.
 *
 * Subtlety that justifies the probe: our tokens are `light-dark(...)`
 * values, and for UNREGISTERED custom properties light-dark() is NOT
 * evaluated at computed-value time — getPropertyValue returns the
 * literal string, which Canvas2D silently rejects (leaving fillStyle
 * at its previous value; the whole scene goes default-black). So each
 * token is resolved through a probe element's `color`, where the
 * browser must produce a real color. The engine re-reads tokens when
 * told to (Engine.refreshTheme), which the theme controller triggers
 * on commit.
 */

export function readTokens(el: Element, names: readonly string[]): Record<string, string> {
  const styles = getComputedStyle(el);
  const out: Record<string, string> = {};

  /* Probe inside the same subtree so it inherits color-scheme —
     that inheritance is what makes light-dark() pick the right arm. */
  const probe = document.createElement("span");
  probe.style.display = "none";
  (el.parentElement ?? document.body).appendChild(probe);

  for (const name of names) {
    const raw = styles.getPropertyValue(name).trim();
    if (!raw) {
      out[name] = ""; // let entities fall back to their `||` defaults
      continue;
    }
    probe.style.color = `var(${name})`;
    out[name] = getComputedStyle(probe).color;
  }

  probe.remove();
  return out;
}
