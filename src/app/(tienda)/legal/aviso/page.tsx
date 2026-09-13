import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso Legal — SILLAGE",
  description: "Aviso legal y condiciones de uso de SILLAGE Perfumería de Lujo.",
};

export default function AvisoLegalPage() {
  return (
    <div className="pt-32 pb-16 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl mb-8 text-warm-900">Aviso Legal</h1>

        <section className="space-y-8 text-sm text-warm-700 leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">1. Datos identificativos</h2>
            <p>
              En cumplimiento del deber de información dispuesto en la Ley 34/2002 de Servicios de la
              Sociedad de la Información y el Comercio Electrónico, se indican los siguientes datos:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>NIF: B-XXXXXXXX{/* TODO: Replace with real NIF */}</li>
              <li>Domicilio social: Calle de Serrano 45, 28001 Madrid, España</li>
              <li>Correo electrónico: info@sillage.com</li>
              <li>Inscrita en el Registro Mercantil de Madrid, Tomo XXXXX, Folio XX, Sección X, Hoja M-XXXXXX{/* TODO: Replace with real registry data */}</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">2. Objeto</h2>
            <p>
              Las presentes condiciones regulan el acceso y uso del sitio web sillage.com, propiedad de
              SILLAGE PARFUMS, S.L., a través del cual los usuarios pueden obtener información sobre la
              empresa y adquirir los productos que se ofrecen.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">3. Condiciones de uso</h2>
            <p>
              El acceso al sitio web es gratuito y no requiere registro previo. El usuario se compromete
              a utilizar el sitio web y sus contenidos de conformidad con la ley, la moral, el orden
              público y las presentes condiciones. SILLAGE PARFUMS, S.L. se reserva el derecho a
              modificar, en cualquier momento, la presentación y configuración del sitio web, así como
              las condiciones requeridas para su acceso y uso.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">4. Propiedad intelectual e industrial</h2>
            <p>
              Todos los contenidos del sitio web, incluidos textos, fotografías, gráficos, imágenes,
              iconos, tecnología, software, enlaces y demás contenidos audiovisuales o sonoros, así como
              su diseño gráfico y códigos fuente, son propiedad intelectual de SILLAGE PARFUMS, S.L.
              o de terceros que han autorizado su uso, sin que puedan entenderse cedidos al usuario
              ninguno de los derechos de explotación sobre los mismos más allá de lo estrictamente
              necesario para el correcto uso del sitio web.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">5. Responsabilidad</h2>
            <p>
              SILLAGE PARFUMS, S.L. no se hace responsable de los daños y perjuicios que puedan
              derivarse del uso, o imposibilidad de uso, del sitio web o de los errores en las
              transacciones realizadas a través de este. Asimismo, no garantiza la ausencia de virus
              ni de otros elementos que puedan producir alteraciones en el sistema informático del
              usuario o en sus documentos electrónicos.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">6. Política de enlaces</h2>
            <p>
              El establecimiento de un enlace desde cualquier página web a cualquiera de las páginas
              de este sitio web requiere la autorización previa y por escrito de SILLAGE PARFUMS, S.L.
              El establecimiento de un enlace a este sitio web no autoriza la reproducción,
              distribución, comunicación pública o transformación de los contenidos del mismo.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">7. Legislación aplicable y jurisdicción</h2>
            <p>
              Las presentes condiciones se rigen por la legislación española. Para la resolución de
              cualquier controversia que pudiera plantearse, las partes se someten a los Juzgados y
              Tribunales de Madrid, renunciando expresamente a cualquier otro fuero que pudiera
              corresponderles.
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