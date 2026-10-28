# PRODUCT.md

## Register
brand (storefront) with a product register for `/admin`. The auth pages (`/login`, `/registro`) are brand-adjacent: they carry the maison's voice but must stay fast and unambiguous.

## Users & purpose
- **Shoppers (Spain, mobile first):** discover and buy perfumes; they sign in only to follow orders and keep favourites, so auth must never feel like a gate.
- **The owner/operator (admin):** runs the shop alone, mostly from a laptop, sometimes from a phone: prepares orders (many are cash on delivery), watches stock, edits products and coupons. They need to see "what needs doing today" at a glance.

## Brand personality
Warm editorial luxury: cream, old gold, charcoal, a high-contrast serif for titles and a clean sans for UI. Calm, confident, generous white space. Spanish (es-ES), no hype. Name: SILLAGE ("the trail a perfume leaves").

## Anti-references
- Generic SaaS/template look: icon-in-input forms, identical card grids, hero-metric tiles.
- Shop chrome (promo bar, mega nav, cookie banner, footer) around a focused task such as signing in.
- Decorative glass, gradient text, side-stripe accents, em dashes in copy.

## Strategic principles
1. One task per screen: auth pages have their own standalone layout, no storefront chrome.
2. The database is the truth; the UI states what needs attention first (admin: pending orders, low stock).
3. Every label and message is plain Spanish; errors say what to do next.
4. Touch targets ≥ 44px; mobile layouts are designed, not shrunk.

## Accessibility
WCAG AA contrast (gold-dark on cream for text, never gold on cream), visible focus rings, labels tied to inputs, `aria-live` for errors, respects `prefers-reduced-motion`.
