import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — SILLAGE",
  description: "Política de privacidad y protección de datos de SILLAGE Perfumería de Lujo.",
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
              El responsable del tratamiento de los datos personales recogidos en este sitio web es:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>SILLAGE PARFUMS, S.L.</li>
              <li>NIF: B-XXXXXXXX</li>
              <li>Domicilio social: Calle de Serrano 45, 28001 Madrid, España</li>
              <li>Correo electrónico: privacidad@sillage.com</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">2. Finalidades del tratamiento</h2>
            <p className="mb-2">
              Los datos personales que usted facilite serán tratados con las siguientes finalidades:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Gestión de pedidos:</strong> procesar, confirmar y entregar los pedidos realizados a través del sitio web.</li>
              <li><strong>Círculo SILLAGE (newsletter):</strong> enviar comunicaciones comerciales sobre nuevos lanzamientos, eventos privados y beneficios exclusivos para miembros, siempre que haya prestado su consentimiento expreso.</li>
              <li><strong>Atención al cliente:</strong> responder a consultas, reclamaciones y solicitudes de información.</li>
              <li><strong>Cumplimiento legal:</strong> cumplir con las obligaciones legales aplicables, incluyendo obligaciones fiscales y contables.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">3. Base legal del tratamiento</h2>
            <p className="mb-2">
              El tratamiento de sus datos personales se basa en las siguientes bases jurídicas:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Ejecución contractual:</strong> para la gestión de pedidos y la prestación de los servicios solicitados.</li>
              <li><strong>Consentimiento:</strong> para el envío de comunicaciones comerciales a través del Círculo SILLAGE (newsletter). Podrá retirar su consentimiento en cualquier momento.</li>
              <li><strong>Interés legítimo:</strong> para la prevención de fraudes y la mejora de los servicios ofrecidos.</li>
              <li><strong>Obligación legal:</strong> para el cumplimiento de obligaciones fiscales y regulatorias.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">4. Plazos de conservación</h2>
            <p>
              Los datos personales se conservarán durante el tiempo necesario para cumplir con la finalidad
              para la que fueron recogidos y las obligaciones legales aplicables. En el caso de los datos
              de la newsletter, se conservarán hasta que el interesado solicite la baja. Los datos
              derivados de una relación comercial se conservarán durante los plazos legales de conservación
              contable y fiscal (hasta 6 años),
              tras lo cual serán eliminados de forma segura.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">5. Derechos del interesado (ARCO)</h2>
            <p className="mb-2">
              De conformidad con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica
              3/2018, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Acceso:</strong> obtener información sobre los datos personales que tratamos sobre usted.</li>
              <li><strong>Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de sus datos personales cuando ya no sean necesarios.</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos en determinadas circunstancias.</li>
              <li><strong>Limitación:</strong> solicitar la limitación del tratamiento de sus datos en los supuestos previstos por la normativa.</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado y de uso común para su traslado a otro responsable.</li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, puede dirigirse a
              privacidad@sillage.com, acompañando copia de su documento de identidad. Asimismo, tiene
              derecho a presentar una reclamación ante la Agencia Española de Protección de Datos
              (agpd.es) si considera que el tratamiento de sus datos no se ajusta a la normativa vigente.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">6. Seguridad</h2>
            <p>
              SILLAGE PARFUMS, S.L. adopta las medidas técnicas y organizativas necesarias para
              garantizar la seguridad de los datos personales y evitar su alteración, pérdida, acceso
              no autorizado o tratamiento indebido. No obstante, el usuario debe ser consciente de que
              las medidas de seguridad en Internet no son inexpugnables.
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