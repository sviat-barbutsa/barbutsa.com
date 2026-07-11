/**
 * canvas-engine/theme — the canvas obeys the CSS token system.
 *
 * Tokens are read from computed style (light-dark() resolves there),
 * so a theme switch recolors the scene atomically with the page.
 * The engine re-reads tokens when told to (see Engine.refreshTheme),
 * which the theme controller triggers on commit.
 */

export function readTokens(
  el: Element,
  names: readonly string[],
): Record<string, string> {
  const styles = getComputedStyle(el);
  const out: Record<string, string> = {};
  for (const name of names) {
    out[name] = styles.getPropertyValue(name).trim();
  }
  return out;
}
