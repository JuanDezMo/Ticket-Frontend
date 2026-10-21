import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Se lee el archivo real: Vitest no procesa CSS (css: false en vite.config.ts)
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

// Lee los colores hex de un bloque de variables (":root" o ".dark") de index.css
function readTokens(selector: ':root' | '.dark'): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`);
  const block = css.slice(start, css.indexOf('\n}', start));
  const tokens: Record<string, string> = {};
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)) {
    tokens[name!] = value!;
  }
  return tokens;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

const TEXT = 4.5;
const NON_TEXT = 3;

// [primer plano, fondo, mínimo]
const PAIRS: [string, string, number][] = [
  ['foreground', 'background', TEXT],
  ['card-foreground', 'card', TEXT],
  ['popover-foreground', 'popover', TEXT],
  ['muted-foreground', 'background', TEXT],
  ['muted-foreground', 'card', TEXT],
  ['muted-foreground', 'muted', TEXT],
  ['primary-foreground', 'primary', TEXT],
  ['destructive', 'card', TEXT],
  ['input', 'card', NON_TEXT],
  ['input', 'background', NON_TEXT],
  ['ring', 'background', NON_TEXT],
  ['ring', 'card', NON_TEXT],
  ['seat-available-fg', 'seat-available-bg', TEXT],
  ['seat-reserved-fg', 'seat-reserved-bg', TEXT],
  ['seat-sold-fg', 'seat-sold-bg', TEXT],
  ['seat-blocked-fg', 'seat-blocked-bg', TEXT],
  ['seat-selected-fg', 'seat-selected-bg', TEXT],
  ['seat-available-border', 'background', NON_TEXT],
  ['seat-reserved-border', 'background', NON_TEXT],
  ['seat-sold-border', 'background', NON_TEXT],
  ['seat-blocked-border', 'background', NON_TEXT],
  ['seat-selected-border', 'background', NON_TEXT],
];

describe.each([':root', '.dark'] as const)('contrast in %s', (selector) => {
  const tokens = readTokens(selector);

  it.each(PAIRS)('%s on %s reaches %d:1', (foreground, background, minimum) => {
    const fg = tokens[foreground];
    const bg = tokens[background];
    expect(fg, `missing --${foreground}`).toBeDefined();
    expect(bg, `missing --${background}`).toBeDefined();
    expect(contrast(fg!, bg!)).toBeGreaterThanOrEqual(minimum);
  });
});
