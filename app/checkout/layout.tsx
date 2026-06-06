import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | SILLAGE",
  description: "Finaliza tu pedido de forma segura con Stripe.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
