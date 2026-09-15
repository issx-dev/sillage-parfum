import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Condiciones de Compra — SILLAGE",
  description: "Precios, pagos, envíos, devoluciones y garantía en SILLAGE.",
};

export default function CondicionesPage() {
  return (
    <div className="pt-32 pb-16 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl mb-8 text-warm-900">Condiciones de Compra</h1>

        <section className="space-y-8 text-sm text-warm-700 leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">1. Quién vende</h2>
            <p>
              Youssef Ait Ali Moha (nombre comercial: SILLAGE), NIE Y8476262V, con
              domicilio en Calle Los Naranjos N.º 7, Bloque 1, Portal 3, 1.º B, 04760
              Berja (Almería), España. Contacto: info@sillage.com.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">2. Precios e impuestos</h2>
            <p>
              Todos los precios se muestran en euros e <strong>incluyen el IVA</strong> y
              cualquier otro impuesto aplicable. El envío es <strong>gratuito</strong>;
              el total a pagar es el que ves desglosado antes de confirmar el pedido, sin
              cargos ocultos. Los descuentos y cupones se aplican sobre el subtotal y se
              muestran antes del pago.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">3. Pago</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Tarjeta mediante Stripe:</strong> el cargo se realiza al confirmar el pedido en un entorno seguro; nunca vemos ni guardamos tu tarjeta.</li>
              <li><strong>Contrareembolso:</strong> pagas en efectivo o con tarjeta al mensajero cuando recibas el pedido.</li>
            </ul>
            <p className="mt-2">
              Al confirmar la compra declaras ser mayor de edad y aceptas estas
              condiciones (casilla obligatoria en el checkout).
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">4. Envíos y entrega</h2>
            <p>
              Enviamos a toda la Península y Baleares con empresa de mensajería. Recibirás
              la confirmación y el seguimiento por correo electrónico. Si hay cualquier
              retraso o incidencia te avisaremos y te propondremos una solución. Revisa
              el pedido al recibirlo y comunícanos cualquier daño en 48 horas con fotos
              del embalaje.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">5. Derecho de desistimiento (14 días)</h2>
            <p className="mb-2">
              Tienes 14 días naturales desde la recepción para devolver tu pedido sin
              indicar motivo ni asumir penalización, escribiendo a info@sillage.com con
              tu número de pedido. Te indicaremos cómo enviarlo; los gastos de la
              devolución corren de tu parte salvo error nuestro. Te reembolsaremos por
              el mismo medio de pago en un máximo de 14 días desde que nos llegue la
              mercancía.
            </p>
            <p>
              <strong>Excepción legal (art. 103.c del RDL 1/2007):</strong> por higiene,
              los frascos desprecintados o usados no admiten desistimiento salvo defecto.
              Si el precinto está intacto, la devolución no tiene problema.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">6. Garantía</h2>
            <p>
              Todos los productos tienen la garantía legal de conformidad de 3 años
              (RDL 1/2007). Si recibes un producto defectuoso o erróneo, lo reponemos o
              te devolvemos el importe, con los gastos a nuestro cargo. Consérvalo en su
              estado y avísanos cuanto antes con fotos.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">7. Reclamaciones</h2>
            <p>
              Escríbenos a info@sillage.com e intentaremos resolverlo de inmediato.
              También tienes a tu disposición las hojas de reclamaciones de la Junta de
              Andalucía y la plataforma europea de resolución de litigios en línea:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold-dark underline-offset-4 hover:underline"
              >
                ec.europa.eu/consumers/odr
              </a>
              . En caso de litigio con consumidores, serán competentes los Juzgados del
              domicilio del consumidor.
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
