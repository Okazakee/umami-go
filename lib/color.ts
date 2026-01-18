export function rgbaFromHex(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const clean = hex.trim().replace('#', '');
  if (clean.length !== 6) return `rgba(0,0,0,${a})`;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return `rgba(0,0,0,${a})`;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
