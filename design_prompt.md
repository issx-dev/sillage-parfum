Crea una web completa de e-commerce de perfumería de lujo llamada "SILLAGE" 
(término francés que describe la estela que deja un perfume). 

La web debe tener una estética luxury-editorial refinada: fondo en crema 
cálido (#FAF7F2), tipografía display en serif elegante (Playfair Display o 
Cormorant Garamond) para títulos y una sans-serif limpia (DM Sans) para 
el cuerpo. Paleta: crema (#FAF7F2), negro carbón (#1A1A1A), dorado viejo 
(#C9A96E) y un acento terracota suave (#C2714F). Usa CSS variables para 
toda la paleta.

━━━━━━━━━━━━━━━━━━━━━━━━
🧭 ESTRUCTURA DE LA PÁGINA
━━━━━━━━━━━━━━━━━━━━━━━━

[1] NAVBAR STICKY
- Logo "SILLAGE" en serif dorado a la izquierda
- Menú central: Hombre | Mujer | Unisex | Novedades | Marcas | Ofertas
- Derecha: icono lupa, icono corazón con badge, icono carrito con badge (número de items)
- Al hacer scroll, fondo cambia a blanco con sombra suave y transición 300ms
- Menú hamburguesa en móvil con overlay lateral

[2] HERO SECTION (pantalla completa)
- Fondo con gradiente mesh sutil en cremas y dorados + textura grain con ::after pseudo-elemento
- Título grande en 2 líneas: "El arte del / perfume, redescubierto." (con la segunda línea 
  en cursiva serif)
- Subtítulo: "Más de 500 fragancias de las mejores casas del mundo, con envío en 24h."
- Dos CTAs: botón primario "Descubrir colección" (fondo negro, letras crema) y 
  botón ghost "Guía de fragancias" (borde dorado)
- Abajo a la derecha, un panel flotante estilo glass-morphism con: 
  "⭐ 4.9 · +12.000 clientes satisfechos"
- Flecha animada de scroll-down con bounce

[3] BARRA DE CONFIANZA (franja oscura)
- 4 iconos con texto en línea horizontal:
  🚚 Envío gratis +50€ | 🔄 Devolución 30 días | ✅ 100% productos originales | 
  💳 Pago seguro SSL
- Animación de entrada fade-in al hacer scroll

[4] CATEGORÍAS DESTACADAS (grid de tarjetas)
- Título de sección: "Explora por familia olfativa"
- Grid de 5 tarjetas en fila (scroll horizontal en móvil):
  Florales | Amaderados | Orientales | Frescos | Gourmands
- Cada tarjeta: fondo con color pastel diferente, nombre grande en serif, 
  ícono SVG representativo, hover con scale(1.03) y sombra dorada
- Al clicar filtra los productos

[5] PRODUCTOS DESTACADOS — "Más vendidos"
- Título editorial con línea decorativa dorada a los lados
- Grid 4 columnas (2 en móvil) de tarjetas de producto, cada una con:
  · Imagen del frasco (usa imágenes placeholder con fondo degradado si no hay reales)
  · Badge dinámico: "NUEVO", "OFERTA -20%", "TOP VENTAS" según corresponda
  · Nombre del perfume en serif
  · Marca en mayúsculas pequeñas y gris
  · Familia olfativa con etiqueta pill (ej: "Amaderado")
  · Precio con precio tachado si hay descuento
  · Iconos de 3 tamaños disponibles: 30ml / 50ml / 100ml seleccionables
  · Botón "Añadir al carrito" con animación pulse al clicar
  · Icono corazón para wishlist con toggle animado

DATOS DE EJEMPLO (al menos 8 productos):
- Chanel Nº5 EDP 100ml — 135€ (Floral Aldehído) — TOP VENTAS
- Sauvage Dior EDT 100ml — 119€ → 95€ con badge OFERTA -20%
- Black Orchid Tom Ford EDP 50ml — 145€ (Oriental)
- Acqua di Giò Armani EDT 100ml — 89€ (Marino)
- Libre Yves Saint Laurent EDP 90ml — 109€ — NUEVO
- Flowerbomb Viktor&Rolf EDP 50ml — 99€ (Floral Gourmand)
- Bleu de Chanel EDP 100ml — 125€ (Amaderado)
- Alien Thierry Mugler EDP 60ml — 79€ → 62€ OFERTA

[6] BANNER EDITORIAL A PANTALLA COMPLETA
- Fondo oscuro casi negro con textura sutil
- Texto grande: "Encuentra tu fragancia perfecta" 
- Subtítulo: "Responde 3 preguntas y te recomendamos el perfume ideal para ti"
- CTA dorado: "Hacer el test →"
- Lado derecho: ilustración SVG decorativa de un frasco de perfume estilizado

[7] SECCIÓN "MARCAS" (carrusel)
- Título: "Casas de perfumería de referencia"
- Carrusel infinito con auto-scroll (CSS animation) con logos de:
  Chanel · Dior · YSL · Tom Ford · Armani · Lancôme · Prada · Gucci · 
  Hermès · Calvin Klein · Versace · Givenchy · Valentino · Bulgari · Hugo Boss
- Logos en gris que se vuelven dorados en hover
- Pausar animación en hover

[8] SECCIÓN "NOVEDADES" — Layout asimétrico
- Título: "Recién llegados"
- Layout de 3 columnas asimétrico: 1 tarjeta grande a la izquierda + 
  2 tarjetas apiladas a la derecha
- Misma estructura de tarjeta de producto pero más grande
- Badge "NUEVO" obligatorio en todas

[9] SECCIÓN "¿POR QUÉ ELEGIRNOS?" — Con iconos animados
- 4 bloques en grid 2x2 (1 columna en móvil):
  🏆 Autenticidad garantizada — Todos nuestros productos son 100% originales y 
     proceden directamente de distribuidores oficiales.
  🌍 Más de 200 marcas — Desde las grandes casas de lujo hasta nichos exclusivos 
     y perfumería artesanal.
  💎 Atención personalizada — Nuestros expertos te ayudan a encontrar la fragancia 
     que mejor expresa tu personalidad.
  📦 Packaging premium — Cada pedido llega en caja de regalo con papel de seda 
     y tarjeta personalizada.
- Cada bloque: icono en círculo dorado, título en serif, texto descriptivo

[10] TESTIMONIOS
- Título: "Lo que dicen nuestros clientes"
- 3 tarjetas en fila con:
  · Avatar circular con iniciales en fondo dorado
  · Nombre y ciudad
  · Estrellas (rating 5/5 con SVG dorados)
  · Texto del testimonio en cursiva
  · Producto comprado con pill
- Animación de entrada staggered al hacer scroll

[11] NEWSLETTER
- Franja en negro con texto: "Sé el primero en conocer nuestras ofertas y novedades"
- Input de email + botón "Suscribirme" en dorado
- Texto pequeño de privacidad debajo
- Al enviar: animación de éxito con checkmark

[12] FOOTER
- Logo grande centrado con tagline
- 4 columnas: Empresa | Ayuda | Categorías | Síguenos
- Iconos sociales: Instagram, TikTok, Pinterest, Facebook
- Barra inferior: © 2025 SILLAGE · Aviso legal · Privacidad · Cookies
- Métodos de pago: Visa, Mastercard, PayPal, Bizum (iconos SVG)

━━━━━━━━━━━━━━━━━━━━━━━━
🛒 CARRITO LATERAL (SLIDE-IN)
━━━━━━━━━━━━━━━━━━━━━━━━
- Panel que aparece desde la derecha al añadir producto o clicar icono carrito
- Overlay semi-transparente oscuro detrás
- Lista de productos con imagen, nombre, precio, selector de cantidad (+/-), 
  botón eliminar (×)
- Subtotal en tiempo real con animación de cambio de número
- CTA grande "Finalizar compra" en negro
- Botón "Seguir comprando" secundario
- Mensaje de envío gratis: barra de progreso "Te faltan Xé para envío gratis"

━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ FUNCIONALIDAD JAVASCRIPT
━━━━━━━━━━━━━━━━━━━━━━━━
- Estado del carrito en localStorage (productos, cantidades, total)
- Actualización en tiempo real de badges del navbar
- Selector de talla (30ml/50ml/100ml) que cambia el precio dinámicamente
- Filtrado de productos por categoría al clicar en las pills de familia olfativa
- Wishlist con corazón toggle (guardar en localStorage)
- Navbar cambia de estilo al hacer scroll (IntersectionObserver o scroll event)
- Animaciones de entrada con Intersection Observer (fade-up staggered)
- Toast notification al añadir al carrito ("✓ Añadido a tu carrito")
- Buscador con overlay que filtra productos en tiempo real
- Carrusel de marcas con pausa en hover

━━━━━━━━━━━━━━━━━━━━━━━━
🎨 SISTEMA DE DISEÑO
━━━━━━━━━━━━━━━━━━━━━━━━
Variables CSS:
--color-cream: #FAF7F2
--color-black: #1A1A1A  
--color-gold: #C9A96E
--color-gold-dark: #A8834A
--color-terracotta: #C2714F
--color-gray-mid: #6B6B6B
--color-gray-light: #E8E4DE
--font-serif: 'Cormorant Garamond', serif
--font-sans: 'DM Sans', sans-serif
--shadow-card: 0 4px 20px rgba(0,0,0,0.08)
--shadow-gold: 0 4px 20px rgba(201,169,110,0.25)
--radius-card: 12px
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)

Importar desde Google Fonts: Cormorant+Garamond:ital,wght@0,400;0,600;1,400 
y DM+Sans:wght@300;400;500;600

━━━━━━━━━━━━━━━━━━━━━━━━
📱 RESPONSIVE
━━━━━━━━━━━━━━━━━━━━━━━━
- Mobile-first con breakpoints: 480px / 768px / 1024px / 1440px
- Grid de productos: 1 col (móvil) → 2 col (tablet) → 4 col (desktop)
- Hero: texto centrado en móvil, tipografía más pequeña
- Navbar: hamburguesa en móvil con menú lateral
- Carrusel de categorías: scroll horizontal táctil en móvil
- Footer: 1 columna en móvil

━━━━━━━━━━━━━━━━━━━━━━━━
✨ DETALLES DE CALIDAD
━━━━━━━━━━━━━━━━━━━━━━━━
- Cursor personalizado: círculo dorado pequeño que sigue al ratón en desktop
- Scrollbar personalizada: delgada y en dorado
- Selección de texto: fondo dorado suave
- Todas las imágenes con lazy loading y fondo placeholder mientras cargan
- Transiciones suaves en TODOS los estados hover e interacciones
- Focus states accesibles para teclado
- Atributos aria-label en botones icónicos
- Smooth scroll en toda la página
- Grain texture overlay sutil en el hero (SVG filter o PNG base64)
