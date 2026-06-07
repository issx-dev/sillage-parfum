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
