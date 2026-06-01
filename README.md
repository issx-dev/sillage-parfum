# SILLAGE — Perfumería de Lujo

E-commerce de perfume de lujo con Next.js 14, TypeScript, Tailwind CSS y Stripe.

## Primeros pasos

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.local.example .env.local
   ```
   Rellenar las keys de Stripe test en `.env.local`:
   - `STRIPE_SECRET_KEY` — de https://dashboard.stripe.com/test/apikeys
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — misma página
   - `STRIPE_WEBHOOK_SECRET` — ver paso 4

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Configurar Stripe CLI para webhooks locales:**
   En otra terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copia el `whsec_...` que te devuelve y pégalo en `.env.local` como `STRIPE_WEBHOOK_SECRET`.

5. **Abrir en el navegador:**
   ```
   http://localhost:3000
   ```

## Probar el pago

Tarjeta de prueba Stripe:
- Número: `4242 4242 4242 4242`
- Caducidad: `12/34`
- CVC: `123`

## Stack

- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind CSS
- **Estado:** Zustand (carrito y wishlist con persistencia en localStorage)
- **Pago:** Stripe Checkout (modo test)
- **Datos:** Catálogo en JSON local (12 productos, 15 marcas)

## Estructura del proyecto

```
parfum/
├── app/                    # Páginas y rutas API
│   ├── api/stripe/         # Rutas Stripe
│   ├── productos/          # Catálogo y detalle de producto
│   ├── carrito/           # Página del carrito
│   ├── checkout/          # Checkout y confirmación
│   └── layout.tsx         # Layout raíz
├── components/
│   ├── home/              # Secciones de la homepage
│   ├── layout/            # Navbar, Footer, CartDrawer
│   └── product/           # Componentes de producto
├── lib/
│   ├── data/              # products.json y brands.json
│   ├── stripe.ts          # Cliente Stripe server-side
│   └── utils.ts           # Utilidades (cn, formatPrice)
├── store/
│   ├── cartStore.ts       # Estado del carrito
│   └── wishlistStore.ts   # Estado de la lista de deseos
└── types/
    └── index.ts           # Tipos TypeScript
```
