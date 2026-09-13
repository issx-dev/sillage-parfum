import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies — SILLAGE",
  description: "Política de cookies de SILLAGE Perfumería de Lujo.",
};

export default function CookiesPage() {
  return (
    <div className="pt-32 pb-16 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl mb-8 text-warm-900">Política de Cookies</h1>

        <section className="space-y-8 text-sm text-warm-700 leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">1. ¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en el dispositivo del usuario
              al visitar un sitio web. Permiten al sitio recordar información sobre la visita, como el
              idioma preferido, el contenido del carrito de compra u otros ajustes de configuración,
              facilitando así la navegación y mejorando la experiencia del usuario.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">2. Tipos de cookies que utilizamos</h2>
            <p className="mb-3">
              En sillage.com utilizamos los siguientes tipos de cookies:
            </p>

            <h3 className="text-sm font-semibold text-warm-900 mb-2">Cookies técnicas</h3>
            <p className="mb-3">
              Son necesarias para el funcionamiento del sitio web. Permiten la gestión del carrito de
              compra y el proceso de pago, la autenticación del usuario y el mantenimiento de la sesión.
              Sin estas cookies, no sería posible realizar compras ni utilizar funciones esenciales del
              sitio. Estas cookies no requieren consentimiento expreso.
            </p>

            <h3 className="text-sm font-semibold text-warm-900 mb-2">Cookies de sesión</h3>
            <p className="mb-3">
              Almacenan información temporal necesaria durante la visita del usuario, como los productos
              añadidos al carrito. Se eliminan automáticamente al cerrar el navegador.
            </p>

            <h3 className="text-sm font-semibold text-warm-900 mb-2">Cookies analíticas</h3>
            <p className="mb-3">
              Nos ayudan a comprender cómo los usuarios interactúan con el sitio web, qué páginas visitan
              con mayor frecuencia y qué errores pueden producirse. Empleamos herramientas de análisis
              que recopilan información de forma anónima y agregada. Estas cookies solo se activan con el
              consentimiento expreso del usuario.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">3. Cookies de terceros</h2>
            <p>
              Algunos servicios integrados en nuestro sitio web pueden establecer cookies propias. Entre
              ellos se incluyen proveedores de pago (como Stripe, que gestiona las transacciones de forma
              segura) y herramientas analíticas. SILLAGE PARFUMS, S.L. no controla ni tiene acceso a
              las cookies establecidas por estos terceros, y cada uno de ellos dispone de su propia
              política de privacidad y cookies.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">4. ¿Cómo gestionar las cookies?</h2>
            <p className="mb-3">
              El usuario puede configurar su navegador para rechazar, bloquear o eliminar las cookies
              instaladas en su dispositivo. A continuacón se indican los enlaces de configuración de los
              navegadores más utilizados:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Google Chrome: Configuración ygt; Privacidad y seguridad ygt; Cookies y otros datos de sitios</li>
              <li>Mozilla Firefox: Opciones ygt; Privacidad y seguridad ygt; Cookies y datos de sitios</li>
              <li>Safari: Preferencias ygt; Privacidad ygt; Cookies y datos de sitios web</li>
              <li>Microsoft Edge: Configuración ygt; Cookies y permisos del sitio</li>
            </ul>
            <p className="mt-3">
              Tenga en cuenta que la desactivación de cookies puede afectar al funcionamiento del sitio
              web y limitar algunas de sus funcionalidades, como el carrito de compra y el proceso de
              pago.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">5. Actualización de la política</h2>
            <p>
              SILLAGE PARFUMS, S.L. se reserva el derecho de actualizar esta política de cookies en
              función de cambios legislativos, técnicos o comerciales. Cualquier modificación será
              publicada en esta página con la fecha de la última actualización.
            </p>
          </div>

          <p className="text-xs text-warm-500 pt-4">
            Última actualización: enero de 2025
          </p>
        </section>
      </div>
    </div>
  );
}