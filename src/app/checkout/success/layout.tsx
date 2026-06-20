import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedido confirmado | SILLAGE",
  description: "Tu pedido ha sido procesado con éxito. Gracias por comprar en SILLAGE.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
