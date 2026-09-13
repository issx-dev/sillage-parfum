import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { pushSpy } = vi.hoisted(() => ({ pushSpy: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

import RegisterPage from "./page";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    pushSpy.mockClear();
  });

  it("shows inline validation errors at the moment", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.type(screen.getByLabelText(/nombre/i), "A");
    await user.tab();
    expect(await screen.findByText(/al menos 2 caracteres/i)).toBeInTheDocument();
  });

  it("toggles password visibility with the eye button", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    const pwd = screen.getByLabelText(/^contraseña/i) as HTMLInputElement;
    await user.click(screen.getByRole("button", { name: /mostrar contraseña/i }));
    expect(pwd.type).toBe("text");
  });

  it("POSTs to /api/auth/register and routes to /cuenta on success", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.type(screen.getByLabelText(/nombre/i), "Ana Ruiz");
    await user.type(screen.getByLabelText(/correo electrónico/i), "ana@email.com");
    await user.type(screen.getByLabelText(/^contraseña/i), "secreta1");
    await user.click(screen.getByRole("button", { name: /registrarme|crear cuenta/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({ method: "POST" })
      );
      expect(pushSpy).toHaveBeenCalledWith("/cuenta");
    });
  });

  it("shows a visible server error when registration fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: "El email ya está registrado" }),
      })) as unknown as typeof fetch
    );
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.type(screen.getByLabelText(/nombre/i), "Ana Ruiz");
    await user.type(screen.getByLabelText(/correo electrónico/i), "ana@email.com");
    await user.type(screen.getByLabelText(/^contraseña/i), "secreta1");
    await user.click(screen.getByRole("button", { name: /registrarme|crear cuenta/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/ya está registrado/i);
  });
});
