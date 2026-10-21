// jsdom no implementa matchMedia: esta versión permite simular el tema del sistema y el ancho
interface MediaState {
  dark: boolean;
  // true = pantalla ancha (escritorio); las pruebas existentes asumen escritorio
  wide: boolean;
  reducedMotion: boolean;
}

const DEFAULT_STATE: MediaState = { dark: false, wide: true, reducedMotion: false };
const state: MediaState = { ...DEFAULT_STATE };
const listeners = new Set<() => void>();

function evaluate(query: string): boolean {
  if (query.includes('prefers-color-scheme: dark')) return state.dark;
  if (query.includes('prefers-reduced-motion')) return state.reducedMotion;
  if (query.includes('min-width')) return state.wide;
  return false;
}

export function installMatchMedia(): void {
  window.matchMedia = (query: string) =>
    ({
      get matches() {
        return evaluate(query);
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      addListener: (listener: () => void) => listeners.add(listener),
      removeListener: (listener: () => void) => listeners.delete(listener),
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

/** Cambia el entorno simulado y avisa a quienes escuchan, como haría el navegador. */
export function setMedia(next: Partial<MediaState>): void {
  Object.assign(state, next);
  listeners.forEach((listener) => listener());
}

export function resetMedia(): void {
  Object.assign(state, DEFAULT_STATE);
}
