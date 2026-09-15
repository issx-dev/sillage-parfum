import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — SILLAGE",
  description: "Cómo tratamos tus datos personales en SILLAGE (RGPD y LOPDGDD).",
};

export default function PrivacidadPage() {
  return (
    <div className="pt-32 pb-16 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl mb-8 text-warm-900">Política de Privacidad</h1>

        <section className="space-y-8 text-sm text-warm-700 leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">1. Responsable del tratamiento</h2>
            <p className="mb-2">
              El responsable del tratamiento de los datos personales recogidos en este
              sitio web es:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Youssef Ait Ali Moha</strong> (nombre comercial: SILLAGE)</li>
              <li><strong>NIE:</strong> Y8476262V</li>
              <li>
                <strong>Domicilio:</strong> Calle Los Naranjos N.º 7, Bloque 1, Portal 3,
                1.º B, 04760 Berja (Almería), España
              </li>
              <li><strong>Contacto de privacidad:</strong> info@sillage.com</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">2. Datos que recogemos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cuenta y pedidos:</strong> nombre, correo electrónico, dirección de entrega y datos de compra.</li>
              <li><strong>Newsletter (Círculo SILLAGE):</strong> correo electrónico, solo si lo facilitas en la ventana de bienvenida, el checkout o el boletín.</li>
              <li><strong>Contacto:</strong> los datos que nos envíes por correo electrónico.</li>
            </ul>
            <p className="mt-2">
              No recogemos categorías especiales de datos. El pago con tarjeta lo procesa
              Stripe: nunca vemos ni almacenamos tu número de tarjeta.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">3. Finalidades y base legal</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Gestionar tus pedidos</strong> (procesar, cobrar, enviar y atender incidencias): ejecución del contrato de compraventa.</li>
              <li><strong>Enviarte novedades y ofertas</strong> del Círculo SILLAGE: tu consentimiento, que puedes retirar cuando quieras (cada correo incluye enlace de baja).</li>
              <li><strong>Atender consultas y reclamaciones:</strong> interés legítimo en prestar un buen servicio.</li>
              <li><strong>Cumplir obligaciones fiscales y contables:</strong> obligación legal (conservación de facturas hasta 6 años).</li>
              <li><strong>Prevenir el fraude:</strong> interés legítimo.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">4. Con quién compartimos tus datos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Stripe</strong> (procesador de pagos, EE. UU./UE con garantías adecuadas): datos necesarios para cobrar tu pedido.</li>
              <li><strong>Empresa de mensajería:</strong> nombre, dirección y teléfono para la entrega.</li>
              <li><strong>Administraciones públicas:</strong> cuando exista obligación legal.</li>
            </ul>
            <p className="mt-2">No vendemos ni cedemos tus datos con fines publicitarios.</p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">5. Plazos de conservación</h2>
            <p>
              Conservamos tus datos solo el tiempo necesario: los de la newsletter hasta
              que pidas la baja; los de cuenta y pedidos mientras dure la relación y,
              después, durante los plazos legales (fiscal y contable, hasta 6 años);
              tras ello se eliminan de forma segura.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">6. Tus derechos</h2>
            <p className="mb-2">
              Conforme al RGPD y la Ley Orgánica 3/2018 (LOPDGDD), tienes derecho de
              acceso, rectificación, supresión, oposición, limitación y portabilidad de
              tus datos, así como a retirar tu consentimiento en cualquier momento sin
              que ello afecte a la licitud del tratamiento previo.
            </p>
            <p>
              Para ejercerlos escríbenos a <strong>info@sillage.com</strong> indicando el
              derecho que quieres ejercer y adjuntando copia de tu documento de
              identidad. Respondemos en el plazo máximo de un mes. Si no quedas
              satisfecho, puedes reclamar ante la Agencia Española de Protección de
              Datos ({" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold-dark underline-offset-4 hover:underline"
              >
                aepd.es
              </a>
              ).
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">7. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas para proteger tus datos
              (cifrado en tránsito, sesiones httpOnly de 24 horas, accesos
              restringidos). Ningún sistema en Internet es inexpugnable, pero tratamos
              tus datos con el máximo cuidado.
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
