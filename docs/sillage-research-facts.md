# SILLAGE — Research Facts (axiom-local-research)

Fecha: 2026-09-09 · Repo: `parfum` · Branch: `feature/chogan-checkout-auth-migration`
Rol: researcher (sin cambios de código de producto).
Método skill `axiom-local-research` v2.0: pasos 1–5. MCP note al final.

> Regla: 2 fuentes independientes = VERIFIED. 1 sola fuente o placeholder = UNVERIFIED.
> Casi todo lo de abajo es UNVERIFIED porque la única fuente es el propio repo (placeholders con TODO).
> Nada de esta ficha debe entrar en copy, JSON-LD o footer hasta verificarse.

## 1) Fact sheet

### NAP canónico (propuesto, TODO UNVERIFIED)
| Campo | Valor en repo | Fuentes | Estado |
|---|---|---|---|
| Nombre comercial | SILLAGE | repo (layout, footer, README) — 1 fuente | UNVERIFIED |
| Razón social | SILLAGE PARFUMS, S.L. | `src/app/legal/aviso/page.tsx` — 1 fuente | UNVERIFIED |
| Dirección | Calle de Serrano 45, 28001 Madrid, España | aviso + privacidad (misma fuente, no independiente) | UNVERIFIED |
| Teléfono | — no existe en el repo | — | UNVERIFIED (falta) |
| Email general | info@sillage.com | aviso — 1 fuente | UNVERIFIED |
| Email privacidad | privacidad@sillage.com | privacidad — 1 fuente | UNVERIFIED |
| Dominio canónico | sillage.com (sitemap/robots/checkout asumen `https://sillage.com`; `SITE_URL` cae a `http://localhost:3000` sin env) | repo — 1 fuente | UNVERIFIED |
| NIF | B-XXXXXXXX (literal `TODO: Replace with real NIF`) | repo | UNVERIFIED (placeholder) |
| Registro Mercantil | Tomo XXXXX / Folio XX / Hoja M-XXXXXX (literal TODO) | repo | UNVERIFIED (placeholder) |
| Google Maps listing | Sin listing localizado: búsqueda "SILLAGE perfumería Madrid Serrano 45" no devuelve ficha | 1 intento de búsqueda | UNVERIFIED — recomendar crear ficha |
| Horarios | No existen en el repo ni en fuentes externas | — | UNVERIFIED (falta) |
| Contacto / atención cliente | Sin página de contacto, sin teléfono, sin WhatsApp en el repo | — | UNVERIFIED (falta) |
| Envío "24h" / "100% originales" | Claims en metadata (`layout.tsx`: "Envío en 24h y productos 100% originales") sin fuente | repo — 1 fuente | UNVERIFIED — no usar en copy hasta probar |

### Sociales (todos placeholders de una sola fuente → UNVERIFIED)
| Red | URL en repo | Verificación externa |
|---|---|---|
| Instagram | https://instagram.com/sillage (footer + newsletter + layout) | Sin segunda fuente; `instagram.com/sillage` no confirmado como cuenta del negocio (existe `sillageperfumesindia`, otro negocio). UNVERIFIED |
| TikTok | https://tiktok.com/@sillage | Sin segunda fuente. UNVERIFIED |
| Facebook | https://facebook.com/sillage | Sin segunda fuente; `House of Sillage` USA usa `facebook.com/HouseOfSillagePerfume` (otro negocio). UNVERIFIED |
| Pinterest | https://pinterest.com/sillage (solo footer) | Sin segunda fuente. UNVERIFIED |

### Conflicto de marca (hecho verificado, 2 fuentes)
- `houseofsillage.com` es "House of Sillage", perfumería de lujo USA (web oficial + Facebook/Instagram oficiales enlazados en su web). VERIFIED (web oficial + sus sociales).
- `sillageperfumes.in` / `@sillageperfumesindia` es un retailer de Bangalore, India (web + Instagram). VERIFIED (web + Instagram).
- Consecuencia: el nombre SILLAGE + dominio sillage.com tiene riesgo alto de colisión/confusión. Decidir NAP y dominio distintivo antes de SEO. (Juicio operativo, no hecho.)

### Catálogo (contexto del repo, no hechos de negocio)
- Modelo: perfumes de equivalencia/inspiración Chogan (ej. `Revenant Intense` ← Sauvage de Dior, código `094M`; `Volare`, `Scarlet Fire`), SKUs `CHOGAN-xxx`, 30/50/70 ml, precios ~18–48 € en `products.json`. Fuente: repo, 1 fuente → precios UNVERIFIED como hechos públicos hasta que el dueño los confirme.
- Chogan oficial: `chogangroupspa.com` (catálogo oficial, 159 productos). Relación del negocio con Chogan (distribuidor/autorizado) UNVERIFIED.

## 2) Auditoría del image manifest (`public/images`)

~78 ficheros. Sin fichero de licencias en el repo (sin LICENSE de imágenes). Clasificación por origen probable:

| Grupo | Ficheros (ejemplos) | Origen probable | Licencia / estado |
|---|---|---|---|
| Hero | `hero/hero-desktop.{avif,jpg,png,webp}`, `hero-mobile.*` (8) | Producción propia o banco (sin metadato) | UNVERIFIED — pedir origen al cliente; no publicar sin confirmar |
| Colecciones | `collections/{bestsellers,exclusive,feminine,masculine,new-arrival,unisex}.{jpg,png}` (12) | Sin metadato | UNVERIFIED — como hero |
| Producto Chogan (estudio propio/AI) | `products/chogan-*-studio-4k.png` (12), `chogan-*-authentic-studio-4k.png` (8), `chogan-*-bottle-*.webp` (12) | Nombres sugieren renders de estudio/AI propios | PLACEHOLDER probable — confirmar si son renders finales o provisionales; si son AI, etiquetar y reemplazar antes de ship según skill |
| Producto marcas (inspiración) | `products/{sauvage-dior,bleu-de-chanel,chanel-5,black-orchid,acqua-di-gio,alien,flowerbomb,la-vie-est-belle,libre-ysl,light-blue-dg,baccarat-rouge,aventus-creed}-front.{jpg,png}` (~20) | Fotos tipo packshot de marcas terceras | RIESGO — NO usar en producción: derechos de Dior/Chanel/YSL/etc.; además el producto vendido es equivalencia Chogan, mostrar el frasco original induce a error. Reemplazar por foto propia del frasco Chogan |
| SBM (marca propia?) | `products/SBM00{1..4}_*.webp`, `Tropical_Breeze_SBM001_100ml.webp` (4) | Origen desconocido | UNVERIFIED — aclarar qué es SBM |
| OG/placeholder | `og-default.jpg`, `placeholder.jpg`, `placeholder.svg`, `bizum.svg` | OG usado en metadata/layout | `og-default.jpg` en uso real (metadata + JSON-LD logo) — verificar que sea arte final con derechos; `bizum.svg` icono de pago dibujado inline en footer, OK |

Reglas aplicables: nada hotlinkeado (todo local, bien); cero imágenes con licencia documentada → ninguna califica como `final` salvo confirmación del cliente. Recomendación: el cliente aporta fotos propias de frascos Chogan + tienda, o se genera set AI-placeholder etiquetado y se reemplaza antes de ship. Marcas terceras fuera.

## 3) Mini scan — 3 competidores (regionales/nacionales, online + tienda)

| Competidor | Base verificada (2 fuentes) | Fortalezas (hechos) | Gap explotable por SILLAGE |
|---|---|---|---|
| Primor — primor.eu | Web oficial (perfumería desde 1953) + EL PAÍS (historia de la cadena) + página de tiendas | Precio (OCU la señala más barata), capilaridad (tiendas en toda España), marca masiva conocida | Curaduría nicho/autor + equivalencias Chogan baratas con asesoramiento; Primor es volumen, no experiencia boutique |
| Druni — druni.es | Web oficial (tiendas + newsletter) + canarias.druni.es (origen Carlet 1987, 350+ tiendas) | Omnicanal fuerte, app, programa de fidelización, 350+ tiendas | Especialización: SILLAGE puede ser "la casa de la estela" (una categoría, a fondo) frente al hipermercado de belleza |
| Sephora España — sephora.es | Web oficial sephora.es + El Corte Inglés (corners Sephora) | Lujo aspiracional, marcas exclusivas, experiencia en tienda | Precio: equivalencias 18–48 € frente a 100 €+ del designer original; SILLAGE juega en "lujo accesible", no en flagship |

Nota honestidad: ventajas como hechos de posicionamiento del repo (precios del JSON), nunca descrédito de competidores.

## 4) Lista UNVERIFIED — preguntas al dueño (nada entra en copy/schema hasta responder)

1. ¿Razón social y NIF reales? (hoy `B-XXXXXXXX`)
2. ¿Dirección real del negocio? (hoy `Serrano 45` placeholder) ¿Hay tienda física o solo online?
3. ¿Existe ficha de Google Business? Si no, ¿la creamos? (no localizada)
4. ¿Teléfono de contacto y prefijo? (hoy ninguno en el repo)
5. ¿Emails reales? (hoy `info@sillage.com`, `privacidad@sillage.com`)
6. ¿Dominio canónico final? (`sillage.com` colisiona con House of Sillage USA; `SITE_URL` hoy cae a localhost sin env)
7. ¿Horario de atención / tienda? (hoy inexistente)
8. ¿Las 4 redes (`instagram.com/sillage`, `tiktok.com/@sillage`, `facebook.com/sillage`, `pinterest.com/sillage`) son cuentas reales del negocio? ¿Handles exactos?
9. ¿Relación con Chogan? (¿distribuidor autorizado? ¿códigos oficiales 094M/001M… usables en público?)
10. ¿Precios y formatos (30/50/70 ml, 18–48 €) del `products.json` son los finales?
11. ¿El claim "Envío en 24h y productos 100% originales" es sostenible? ¿Operador y tiempos reales?
12. ¿Origen y licencia de hero/colecciones? ¿Fotos propias, stock (URL+licencia) o AI?
13. ¿Los renders `chogan-*-studio-4k` / `authentic-studio-4k` son finales o placeholders AI?
14. ¿Qué es la línea SBM (`SBM001…004`)? ¿Sigue en catálogo?
15. ¿Autorización para mostrar (o mejor retirar) las fotos de frascos Dior/Chanel/YSL? El producto es equivalencia: hay que fotografiar el frasco Chogan real.
16. Datos del Registro Mercantil reales (hoy Tomo/Folio/Hoja `XXXXX`).
17. ¿Hay reseñas reales utilizables (autor + fuente)? Hoy cero: se reporta como cero, sin inventar.

## MCP note
- Google Maps Places MCP: no usado — requiere OAuth de Google Cloud + Places API (New) con credenciales del usuario; agente no las inventa.
- Tavily (`tvly`): usado para búsquedas web de verificación (Serrano 45, sillage, Chogan, Primor, Druni, Sephora, Instagram).
- Firecrawl: no necesario (sin gaps que lo exigieran); reservado según skill.
- Skill `maps`: no aplicada (sin listing que geocodificar hasta NAP real).
