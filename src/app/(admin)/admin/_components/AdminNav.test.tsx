import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { pathnameSpy } = vi.hoisted(() => ({
  pathnameSpy: vi.fn(() => "/admin/pedidos"),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameSpy(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={typeof href === "string" ? href : ""} {...rest}>
      {children}
    </a>
  ),
}));

import { AdminSidebar, AdminTopbar, AdminSidebarStateProvider } from "./AdminNav";

function renderChrome() {
  return render(
    <AdminSidebarStateProvider>
      <AdminSidebar email="admin@sillage.test" />
      <AdminTopbar email="admin@sillage.test" />
    </AdminSidebarStateProvider>
  );
}

describe("AdminNav (patrón sidebar-07)", () => {
  beforeEach(() => {
    pathnameSpy.mockReturnValue("/admin/pedidos");
  });

  it("sidebar: renderiza las 5 secciones con sus rutas y marca la activa", () => {
    const { container } = renderChrome();
    const sidebar = container.querySelector("aside");
    expect(sidebar).toBeInTheDocument();

    for (const [label, href] of [
      ["Resumen", "/admin/resumen"],
      ["Pedidos", "/admin/pedidos"],
      ["Productos", "/admin/productos"],
      ["Stock", "/admin/stock"],
      ["Cupones", "/admin/cupones"],
    ] as const) {
      const link = sidebar!.querySelector(`a[href="${href}"]`);
      expect(link).toBeInTheDocument();
      expect(link!.textContent).toContain(label);
    }

    const active = sidebar!.querySelector('a[href="/admin/pedidos"]');
    expect(active).toHaveAttribute("aria-current", "page");
  });

  it("sidebar: agrupa secciones con etiquetas y footer con Ver tienda + Salir", () => {
    const { container } = renderChrome();
    const sidebar = container.querySelector("aside");
    expect(sidebar!.textContent).toContain("General");
    expect(sidebar!.textContent).toContain("Gestión");

    const storeLink = sidebar!.querySelector('a[href="/"]');
    expect(storeLink).toBeInTheDocument();
    expect(storeLink!.textContent).toContain("Ver tienda");

    const logout = screen.getAllByRole("button", { name: /cerrar sesión/i });
    expect(logout.length).toBeGreaterThan(0);
    // El footer usa la etiqueta corta "Salir"
    expect(sidebar!.textContent).toContain("Salir");
  });

  it("header: muestra breadcrumb con la sección actual y trigger de colapso", () => {
    const { container } = renderChrome();
    const breadcrumb = container.querySelector('nav[aria-label="Miga de pan"]');
    expect(breadcrumb).toBeInTheDocument();
    expect(breadcrumb!.textContent).toContain("Administración");
    expect(breadcrumb!.textContent).toContain("Pedidos");
    expect(
      breadcrumb!.querySelector('[aria-current="page"]')?.textContent
    ).toContain("Pedidos");

    expect(
      screen.getByRole("button", { name: /colapsar barra lateral/i })
    ).toBeInTheDocument();
  });

  it("colapso: el trigger alterna expandido/colapsado sin romper la navegación", async () => {
    const user = userEvent.setup();
    const { container } = renderChrome();
    const sidebar = container.querySelector("aside");
    expect(sidebar!.className).toContain("w-64");

    await user.click(screen.getByRole("button", { name: /colapsar barra lateral/i }));
    expect(sidebar!.className).toContain("w-[4.5rem]");
    expect(
      screen.getByRole("button", { name: /expandir barra lateral/i })
    ).toBeInTheDocument();
    // Las secciones siguen enlazando tras colapsar
    expect(sidebar!.querySelector('a[href="/admin/stock"]')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /expandir barra lateral/i }));
    expect(sidebar!.className).toContain("w-64");
  });

  it("breadcrumb: en detalle anidado muestra sección + detalle", () => {
    pathnameSpy.mockReturnValue("/admin/productos/nuevo");
    const { container } = renderChrome();
    const breadcrumb = container.querySelector('nav[aria-label="Miga de pan"]');
    expect(breadcrumb!.textContent).toContain("Productos");
    expect(breadcrumb!.textContent).toContain("Nuevo");
  });
});
