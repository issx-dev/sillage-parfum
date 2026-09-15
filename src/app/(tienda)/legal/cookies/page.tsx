import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies — SILLAGE",
  description: "Qué cookies usa SILLAGE y cómo gestionarlas.",
};

const COOKIE_TABLE: { nombre: string; finalidad: string; duración: string; tipo: string }[] = [
  {
    nombre: "auth_token",
    finalidad: "Mantener tu sesión iniciada de forma segura (httpOnly, 24 h).",
    duración: "24 horas",
    tipo: "Técnica · propia",
  },
  {
    nombre: "sillage-cart",
    finalidad: "Recordar el contenido de tu carrito en este navegador.",
    duración: "Persistente (hasta que lo vacíes o borres datos)",
    tipo: "Técnica · almacenamiento local",
  },
  {
    nombre: "sillage-wishlist",
    finalidad: "Recordar tu lista de deseos en este navegador.",
    duración: "Persistente (hasta que la vacíes o borres datos)",
    tipo: "Técnica · almacenamiento local",
  },
  {
    nombre: "sillage-consent",
    finalidad: "Recordar tu elección en el aviso de cookies.",
    duración: "Persistente (hasta que borres datos)",
    tipo: "Técnica · almacenamiento local",
  },
  {
    nombre: "chogan_lead_dismissed",
    finalidad: "No volver a mostrarte la ventana de bienvenida.",
    duración: "Persistente (hasta que borres datos)",
    tipo: "Técnica · almacenamiento local",
  },
  {
    nombre: "Cookies de Stripe",
    finalidad: "Procesar el pago con tarjeta de forma segura en el checkout (stripe.com).",
    duración: "Según política de Stripe",
    tipo: "Técnica · tercero",
  },
];

export default function CookiesPage() {
  return (
    <div className="pt-32 pb-16 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl mb-8 text-warm-900">Política de Cookies</h1>

        <section className="space-y-8 text-sm text-warm-700 leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">1. ¿Qué son las cookies?</h2>
            <p>
              Son pequeños archivos que se guardan en tu dispositivo para que la web
              recuerde información de tu visita (sesión, carrito, preferencias). Algunas
              viven en el almacenamiento local del navegador en lugar de en cookies
              clásicas; te las detallamos igual, por transparencia.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">2. Qué usamos en SILLAGE</h2>
            <p className="mb-3">
              Solo cookies técnicas, necesarias para que la tienda funcione. No usamos
              analítica ni publicidad de terceros. Listado completo y honesto:
            </p>
            <div className="overflow-x-auto rounded-card border border-warm-200">
              <table className="w-full min-w-[560px] caption-bottom text-[13px]">
                <thead>
                  <tr className="border-b border-warm-200 bg-white text-left">
                    <th className="px-3 py-2 font-semibold text-warm-900">Nombre</th>
                    <th className="px-3 py-2 font-semibold text-warm-900">Finalidad</th>
                    <th className="px-3 py-2 font-semibold text-warm-900">Duración</th>
                    <th className="px-3 py-2 font-semibold text-warm-900">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIE_TABLE.map((row) => (
                    <tr key={row.nombre} className="border-b border-warm-100 bg-cream last:border-0">
                      <td className="px-3 py-2 font-mono text-xs text-warm-900">{row.nombre}</td>
                      <td className="px-3 py-2">{row.finalidad}</td>
                      <td className="px-3 py-2">{row.duración}</td>
                      <td className="px-3 py-2">{row.tipo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Las cookies técnicas están exentas de consentimiento (art. 22.2 LSSI y
              Guía de cookies de la AEPD), pero te las mostramos todas igualmente. Si
              algún día añadimos analítica o marketing, te pediremos permiso antes y
              actualizaremos esta tabla.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">3. Tu elección</h2>
            <p>
              Al entrar verás un aviso donde puedes aceptar todas o quedarte solo con
              las técnicas. Tu elección se guarda en este navegador y puedes cambiarla
              cuando quieras borrando los datos del sitio; el aviso volverá a aparecer.
              También puedes gestionarlas desde tu navegador:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Chrome: Configuración › Privacidad y seguridad › Cookies y otros datos de sitios</li>
              <li>Firefox: Ajustes › Privacidad y seguridad › Cookies y datos de sitios</li>
              <li>Safari: Ajustes › Privacidad › Cookies y datos de sitios web</li>
              <li>Edge: Configuración › Cookies y permisos del sitio</li>
            </ul>
            <p className="mt-2">
              Bloquear las técnicas impedirá comprar o iniciar sesión: son las que
              hacen que el carrito y la cuenta funcionen.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">4. Actualizaciones</h2>
            <p>
              Actualizaremos esta página si cambian la ley, la tecnología o nuestros
              servicios, indicando siempre la fecha de la última revisión.
            </p>
          </div>

          <p className="text-xs text-warm-500 pt-4">
            Última actualización: septiembre de 2026
          </p>
        </section>
      </div>
    </div>
  );
}
