import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | SILLAGE",
  description: "Finaliza tu pedido de forma segura con Stripe.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://js.stripe.com" />
      <link rel="dns-prefetch" href="https://api.stripe.com" />
      {children}
    </>
  );
}