export function hits(px: number, py: number, ps: number, ox: number, oy: number, ow: number, oh: number): boolean {
  return px < ox + ow && px + ps > ox && py < oy + oh && py + ps > oy;
}
