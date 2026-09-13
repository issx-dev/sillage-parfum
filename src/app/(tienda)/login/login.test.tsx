import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { pushSpy, refreshSpy } = vi.hoisted(() => ({
  pushSpy: vi.fn(),
  refreshSpy: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy, refresh: refreshSpy }),
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

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    pushSpy.mockClear();
    refreshSpy.mockClear();
  });

  it("shows inline validation errors at the moment (email + password)", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const email = screen.getByLabelText(/correo electrónico/i);
    await user.type(email, "no-es-email");
    await user.tab();
    expect(await screen.findByText(/email válido|correo válido/i)).toBeInTheDocument();
  });

  it("toggles password visibility with the eye button", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const pwd = screen.getByLabelText(/^contraseña/i) as HTMLInputElement;
    expect(pwd.type).toBe("password");
    await user.click(screen.getByRole("button", { name: /mostrar contraseña/i }));
    expect(pwd.type).toBe("text");
  });

  it("POSTs to /api/auth/login and routes to /cuenta on success", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/correo electrónico/i), "tu@email.com");
    await user.type(screen.getByLabelText(/^contraseña/i), "secreta1");
    await user.click(screen.getByRole("button", { name: /acceder/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({ method: "POST" })
      );
      expect(pushSpy).toHaveBeenCalledWith("/cuenta");
    });
  });

  it("shows a visible server error when credentials are rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: "Credenciales inválidas" }),
      })) as unknown as typeof fetch
    );
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/correo electrónico/i), "tu@email.com");
    await user.type(screen.getByLabelText(/^contraseña/i), "malaaaaa");
    await user.click(screen.getByRole("button", { name: /acceder/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/credenciales inválidas/i);
  });

  it("disables the submit button and shows loading state while submitting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 200)
          )
      ) as unknown as typeof fetch
    );
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByLabelText(/correo electrónico/i), "tu@email.com");
    await user.type(screen.getByLabelText(/^contraseña/i), "secreta1");
    await user.click(screen.getByRole("button", { name: /acceder/i }));
    expect(await screen.findByText(/verificando/i)).toBeInTheDocument();
  });
});
