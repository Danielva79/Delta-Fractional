# deltafractional.com

Sitio de **Delta Fractional**, la marca con la que Daniel Villegas trabaja como director financiero externo para pymes.

- **Stack:** [Astro](https://astro.build) en modo estático (HTML sin JavaScript por defecto), publicado en GitHub Pages con GitHub Actions.
- **Idiomas:** español en `/` y inglés en `/en/`.
- **Contenido:** `src/content/es.json` y `src/content/en.json`. Guía para cambiar textos y fotos: [CONTENIDO.md](CONTENIDO.md).

## Comandos

Requiere Node 22.23.4 o posterior.

```bash
npm install
npm run dev       # servidor local en http://localhost:4321
npm run build     # genera dist/; falla si el contenido tiene errores
npm run preview   # sirve dist/
```

Variables de entorno: ver [.env.example](.env.example). Ningún secreto va en el repo.

## Estructura

```
fotos/                 fotos reales (se optimizan en el build; ver CONTENIDO.md)
public/                archivos que se sirven tal cual: fuentes, favicons, logos, gráficos, marcadores, OG, CNAME
src/content/           es.json, en.json y el esquema que los valida (schema.ts)
src/lib/               carga del contenido y armado de enlaces (WhatsApp, diagnóstico, rutas)
src/components/        Header, Footer, Photo, Icono y las secciones de la página
src/layouts/Base.astro <head> completo: SEO, Open Graph, hreflang, fuentes y favicons
src/pages/             /, /en/ y /vista-interna/ (página de revisión, sin indexar)
src/styles/            tokens.css (marca, no editar a mano) y global.css
```

## Reglas de marca que el código respeta

- Colores solo con las variables de `src/styles/tokens.css`; el naranja va solo en acentos.
- Figtree autoalojada (`public/fonts/`, licencia OFL); íconos Lucide de línea (licencia ISC, `src/iconos/`).
- Logo desde los archivos de `public/img/logo/`; nunca recompuesto con fuentes. Mínimo 140 px de ancho; entre 140 y 180 px se usa la versión con el descriptor oscuro.
- Nunca se publica un dato inventado ni un `TODO`: el esquema convierte los pendientes en vacíos y los componentes los ocultan.

## Publicación

- **Vista previa:** `https://danielva79.github.io/delta-fractional-preview/` (sin indexar), en un repo aparte.
- **Producción:** `deltafractional.com`, desde `main`. El dominio está en `public/CNAME`; el DNS no se toca.

El paso a producción y la vista previa se documentan en detalle cuando se configure el workflow (fase 7-8 del rediseño).

## Licencias

Figtree: SIL Open Font License 1.1 (`public/fonts/OFL.txt`). Lucide: ISC (`src/iconos/LICENSE-lucide.txt`). Logo, gráficos y textos: Delta Fractional, todos los derechos reservados.
