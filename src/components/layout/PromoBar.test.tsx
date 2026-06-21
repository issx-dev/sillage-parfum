import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { PromoBar } from "./PromoBar";

// Mock next/link to render anchor tag
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

describe("PromoBar container layout", () => {
  it("verifies the outer container has overflow-visible and does NOT have overflow-hidden", () => {
    const { container } = render(<PromoBar />);
    
    // The top-level div is the outer container
    const outerContainer = container.firstChild as HTMLElement;
    expect(outerContainer).toBeInTheDocument();
    
    expect(outerContainer.className).toContain("overflow-visible");
    expect(outerContainer.className).not.toContain("overflow-hidden");
    expect(outerContainer.className).toContain("pt-[env(safe-area-inset-top)]");
    expect(outerContainer.className).toContain("min-h-8");
  });
});
