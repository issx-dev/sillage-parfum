import "@testing-library/jest-dom/vitest";

// jsdom provides localStorage and matchMedia, but some libs probe for them
// defensively. Defensive guards don't hurt and keep the setup explicit.
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
}

// Note: tests that exercise persisted stores use beforeEach to wipe state.

// localStorage: jsdom no siempre lo expone (origen opaco según versión),
// y 39+ tests lo usan directa o indirectamente (stores persistidos).
// Mock en memoria determinista para toda la suite.
if (typeof window !== "undefined" && !window.localStorage) {
  const store = new Map<string, string>();
  window.localStorage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(String(key), String(value)),
  } as unknown as Storage;
}
