import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

import { EmailLeadModal } from "./EmailLeadModal";

describe("EmailLeadModal", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 201, json: async () => ({ success: true }) }))
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("appears after 5s when not dismissed and persists the email via POST /api/newsletter", async () => {
    render(<EmailLeadModal />);
    expect(screen.queryByPlaceholderText(/correo/i)).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(5000);
    expect(screen.getByPlaceholderText(/correo/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/correo/i), { target: { value: "ana@email.com" } });
    fireEvent.click(screen.getByRole("button", { name: /obtener mi 10%/i }));

    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledWith(
      "/api/newsletter",
      expect.objectContaining({ method: "POST" })
    );
    const calls = vi.mocked(fetch).mock.calls;
    const body = JSON.parse((calls[0]?.[1] as RequestInit).body as string);
    expect(body).toEqual({ email: "ana@email.com", source: "lead_modal" });

    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByText(/cupón activado/i)).toBeInTheDocument();
    expect(localStorage.getItem("chogan_discount_code")).toBe("BIENVENIDA10");
  });

  it("treats an already-subscribed email (409) as success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: "Este email ya está suscrito", alreadySubscribed: true }),
    } as Response);
    render(<EmailLeadModal />);
    await vi.advanceTimersByTimeAsync(5000);

    fireEvent.change(screen.getByPlaceholderText(/correo/i), { target: { value: "dup@email.com" } });
    fireEvent.click(screen.getByRole("button", { name: /obtener mi 10%/i }));

    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByText(/cupón activado/i)).toBeInTheDocument();
  });

  it("shows a visible error when the request fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network down"));
    render(<EmailLeadModal />);
    await vi.advanceTimersByTimeAsync(5000);

    fireEvent.change(screen.getByPlaceholderText(/correo/i), { target: { value: "a@b.com" } });
    fireEvent.click(screen.getByRole("button", { name: /obtener mi 10%/i }));

    await vi.advanceTimersByTimeAsync(0);
    expect(screen.getByRole("alert")).toHaveTextContent(/network down/i);
    // Modal stays open so the user can retry
    expect(screen.getByPlaceholderText(/correo/i)).toBeInTheDocument();
  });

  it("stays hidden when already dismissed", () => {
    localStorage.setItem("chogan_lead_dismissed", "true");
    render(<EmailLeadModal />);
    vi.advanceTimersByTime(10000);
    expect(screen.queryByPlaceholderText(/correo/i)).not.toBeInTheDocument();
  });
});
