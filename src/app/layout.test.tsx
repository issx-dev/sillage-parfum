import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import RootLayout from "./layout";

// Mock next/font/google
vi.mock("next/font/google", () => ({
  Cormorant_Garamond: () => ({
    variable: "font-serif",
  }),
  Inter: () => ({
    variable: "font-sans",
  }),
}));

describe("RootLayout minimal shell", () => {
  it("renders children without store chrome (lives in (tienda)/layout)", async () => {
    const layout = await RootLayout({
      children: <div data-testid="custom-child-element">Unique Child Content</div>,
    });
    const { getByTestId, container } = render(layout);

    const child = getByTestId("custom-child-element");
    expect(child).toBeInTheDocument();
    expect(child.textContent).toBe("Unique Child Content");

    // Sin chrome: ni header de tienda ni main ni footer en el root.
    expect(container.querySelector("header")).not.toBeInTheDocument();
    expect(container.querySelector("main")).not.toBeInTheDocument();
    expect(container.querySelector("footer")).not.toBeInTheDocument();
  });

  it("sets the html document language to Spanish (es)", async () => {
    const layout = await RootLayout({
      children: <div>Content</div>,
    });
    const { container } = render(layout);

    const htmlElement = container.querySelector("html");
    expect(htmlElement).toBeInTheDocument();
    expect(htmlElement).toHaveAttribute("lang", "es");
  });
});
