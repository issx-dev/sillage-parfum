import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { HeroSection } from "./HeroSection";

// Mock next/link to render anchor tag
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

describe("HeroSection optimized assets and layout", () => {
  it("renders picture element with modern AVIF and WebP sources, and explicit img dimensions", () => {
    const { container } = render(<HeroSection />);
    
    const picture = container.querySelector("picture");
    expect(picture).toBeInTheDocument();
    
    // Check that we have sources for avif, webp, and jpg for both mobile and desktop
    const sources = picture?.querySelectorAll("source");
    expect(sources).toBeDefined();
    
    const sourceTypes = Array.from(sources || []).map(s => ({
      media: s.getAttribute("media"),
      srcSet: s.getAttribute("srcSet"),
      type: s.getAttribute("type")
    }));

    // Verify AVIF sources
    const mobileAvif = sourceTypes.find(s => s.media === "(max-width: 639px)" && s.type === "image/avif");
    expect(mobileAvif).toBeDefined();
    expect(mobileAvif?.srcSet).toBe("/images/hero/hero-mobile.avif");

    const desktopAvif = sourceTypes.find(s => s.media === "(min-width: 640px)" && s.type === "image/avif");
    expect(desktopAvif).toBeDefined();
    expect(desktopAvif?.srcSet).toBe("/images/hero/hero-desktop.avif");

    // Verify WebP sources
    const mobileWebp = sourceTypes.find(s => s.media === "(max-width: 639px)" && s.type === "image/webp");
    expect(mobileWebp).toBeDefined();
    expect(mobileWebp?.srcSet).toBe("/images/hero/hero-mobile.webp");

    const desktopWebp = sourceTypes.find(s => s.media === "(min-width: 640px)" && s.type === "image/webp");
    expect(desktopWebp).toBeDefined();
    expect(desktopWebp?.srcSet).toBe("/images/hero/hero-desktop.webp");

    // Verify fallback JPG sources
    const mobileJpg = sourceTypes.find(s => s.media === "(max-width: 639px)" && !s.type);
    expect(mobileJpg).toBeDefined();
    expect(mobileJpg?.srcSet).toBe("/images/hero/hero-mobile.jpg");

    const desktopJpg = sourceTypes.find(s => s.media === "(min-width: 640px)" && !s.type);
    expect(desktopJpg).toBeDefined();
    expect(desktopJpg?.srcSet).toBe("/images/hero/hero-desktop.jpg");

    // Verify fallback img has explicit 1024x1024 dimensions
    const img = picture?.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("width", "1024");
    expect(img).toHaveAttribute("height", "1024");
  });

  it("injects responsive preload link elements into the DOM", () => {
    const { container } = render(<HeroSection />);
    
    // We expect <link rel="preload"> tags to be rendered in the document/container
    const preloadLinks = container.querySelectorAll("link[rel='preload']");
    expect(preloadLinks.length).toBeGreaterThanOrEqual(2);
    
    const preloads = Array.from(preloadLinks).map(link => ({
      as: link.getAttribute("as"),
      href: link.getAttribute("href"),
      media: link.getAttribute("media"),
      type: link.getAttribute("type")
    }));

    const mobilePreload = preloads.find(p => p.media === "(max-width: 639px)" && p.type === "image/avif");
    expect(mobilePreload).toBeDefined();
    expect(mobilePreload?.href).toBe("/images/hero/hero-mobile.avif");
    expect(mobilePreload?.as).toBe("image");

    const desktopPreload = preloads.find(p => p.media === "(min-width: 640px)" && p.type === "image/avif");
    expect(desktopPreload).toBeDefined();
    expect(desktopPreload?.href).toBe("/images/hero/hero-desktop.avif");
    expect(desktopPreload?.as).toBe("image");
  });
});
