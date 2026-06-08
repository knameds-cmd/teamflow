// 이름 문자열 → 결정적 HSL 색상. 같은 이름은 항상 같은 색.
const PALETTE_HUES = [220, 250, 280, 320, 350, 10, 30, 150, 175, 200];

export function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const hue = PALETTE_HUES[hash % PALETTE_HUES.length];
  return `hsl(${hue}, 65%, 55%)`;
}

export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
