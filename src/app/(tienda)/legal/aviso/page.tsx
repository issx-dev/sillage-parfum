import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso Legal — SILLAGE",
  description: "Aviso legal e identificación del titular de SILLAGE.",
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
              En cumplimiento del deber de información recogido en el artículo 10 de la Ley
              34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de
              Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos del titular
              de este sitio web:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Titular:</strong> Youssef Ait Ali Moha (empresario individual)</li>
              <li><strong>NIE:</strong> Y8476262V</li>
              <li>
                <strong>Domicilio:</strong> Calle Los Naranjos N.º 7, Bloque 1, Portal 3,
                1.º B, 04760 Berja (Almería), España
              </li>
              <li><strong>Correo electrónico:</strong> info@sillage.com</li>
              <li><strong>Nombre comercial:</strong> SILLAGE</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">2. Objeto</h2>
            <p>
              Las presentes condiciones regulan el acceso y el uso del sitio web de SILLAGE,
              a través del cual se ofrece información sobre perfumería de autor y la venta
              en línea de los productos del catálogo. La utilización del sitio web atribuye
              la condición de usuario e implica la aceptación plena de este Aviso Legal,
              la Política de Privacidad, la Política de Cookies y las Condiciones de Compra.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">3. Condiciones de uso</h2>
            <p>
              El acceso al sitio web es gratuito y, salvo para la compra y la cuenta de
              cliente, no requiere registro previo. El usuario se compromete a utilizar el
              sitio web y sus contenidos conforme a la ley, la moral, el orden público y
              las presentes condiciones, y a no emplearlos para fines ilícitos o lesivos.
              El titular se reserva el derecho a modificar en cualquier momento la
              presentación, la configuración y los contenidos del sitio web, así como las
              condiciones exigidas para su acceso y uso.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">4. Propiedad intelectual e industrial</h2>
            <p>
              Todos los contenidos del sitio web —textos, fotografías, gráficos, imágenes,
              iconos, diseño gráfico y código fuente— son propiedad del titular o de
              terceros que han autorizado su uso, y están protegidos por la normativa de
              propiedad intelectual e industrial. No se cede al usuario ningún derecho de
              explotación sobre los mismos más allá de lo estrictamente necesario para el
              correcto uso del sitio web. Las marcas de perfumería de diseñador citadas
              como inspiración olfativa pertenecen a sus respectivos titulares.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">5. Responsabilidad</h2>
            <p>
              El titular no se hace responsable de los daños y perjuicios que pudieran
              derivarse del uso o la imposibilidad de uso del sitio web, ni garantiza la
              ausencia de virus u otros elementos que pudieran alterar los sistemas del
              usuario, sin perjuicio de las medidas de seguridad adoptadas. La información
              sobre disponibilidad, precios y características de los productos se actualiza
              con diligencia; en caso de error manifiesto se informará al cliente antes de
              confirmar el pedido.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">6. Política de enlaces</h2>
            <p>
              El establecimiento de un enlace desde cualquier sitio web externo hacia
              páginas de este sitio requiere autorización previa y por escrito del
              titular. Dicho enlace no autoriza la reproducción, distribución,
              comunicación pública ni transformación de los contenidos.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-warm-900 mb-3">7. Legislación aplicable y jurisdicción</h2>
            <p>
              Las presentes condiciones se rigen por la legislación española. En caso de
              controversia con consumidores, serán competentes los Juzgados y Tribunales
              del domicilio del consumidor, conforme a la normativa vigente. Existe a su
              disposición la plataforma europea de resolución de litigios en línea de la
              Comisión Europea:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold-dark underline-offset-4 hover:underline"
              >
                ec.europa.eu/consumers/odr
              </a>
              .
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
