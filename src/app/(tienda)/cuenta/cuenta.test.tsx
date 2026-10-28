import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const { pushSpy } = vi.hoisted(() => ({ pushSpy: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy, refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

import AccountPage from "./page";

const meUser = { id: "u1", name: "Ana Ruiz", email: "ana@email.com" };

function stubFetch(orders: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url).includes("/api/auth/me")) {
        return { ok: true, json: async () => ({ user: meUser }) };
      }
      return { ok: true, json: async () => ({ orders }) };
    }) as unknown as typeof fetch
  );
}

const orderEnviado = {
  id: "11111111-2222-3333-4444-555555555555",
  total: 56.7,
  currency: "eur",
  paymentStatus: "paid",
  fulfillmentStatus: "enviado",
  couponCode: "BIENVENIDA10",
  paymentMethod: "cod",
  items: [{ name: "Revenant", quantity: 1, price: 63, size_ml: 70 }],
  createdAt: "2026-09-01T10:00:00.000Z",
};

describe("AccountPage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    pushSpy.mockClear();
  });

  it("renders orders with payment and fulfillment status", async () => {
    stubFetch([orderEnviado]);
    render(<AccountPage />);

    expect(await screen.findByRole("heading", { name: "Ana Ruiz" })).toBeInTheDocument();
    expect(screen.getByText("Pagado")).toBeInTheDocument();
    expect(screen.getByText("Enviado")).toBeInTheDocument();
    expect(screen.getAllByText(/56,70/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Contrareembolso/)).toBeInTheDocument();
  });

  it("hides BIENVENIDA10 once the user already has orders", async () => {
    stubFetch([orderEnviado]);
    render(<AccountPage />);

    await screen.findByRole("heading", { name: "Ana Ruiz" });
    await waitFor(() => {
      expect(screen.queryByText("BIENVENIDA10")).not.toBeInTheDocument();
    });
    expect(screen.getByText("SILLAGE2")).toBeInTheDocument();
  });

  it("shows BIENVENIDA10 and an empty state for users without orders", async () => {
    stubFetch([]);
    render(<AccountPage />);

    await screen.findByRole("heading", { name: "Ana Ruiz" });
    expect(screen.getByText("BIENVENIDA10")).toBeInTheDocument();
    expect(screen.getByText(/aún no has realizado ningún pedido/i)).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch
    );
    render(<AccountPage />);

    await waitFor(() => {
      expect(pushSpy).toHaveBeenCalledWith("/login");
    });
  });
});
