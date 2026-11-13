# Instrucciones del proyecto: deltafractional.com

> Copias idénticas: `CLAUDE.md`, `AGENTS.md` y `GEMINI.md`. Si cambia una, cambie las tres.
> Las instrucciones generales (método DOE, aprendizajes transversales) están en `~/.claude/CLAUDE.md`.

## Qué es
Sitio estático de Delta Fractional (Daniel Villegas, director financiero externo para pymes). Astro 7, salida estática, GitHub Pages. El repo es **público**.

## Mapa DOE en este repo
- **Directiva:** el prompt del rediseño y el kit de marca viven **fuera del repo** (kit en `kit/`, ignorado por git; nunca se sube). Guías para Daniel: `CONTENIDO.md`, `README.md`.
- **Ejecución:** `npm run build` (valida contenido y fotos), scripts en `scripts/` cuando existan.
- **Intermedios:** `.tmp/` (bocetos, capturas, pruebas). Ignorado por git.

## Reglas que no se negocian
1. Nunca inventar contenido (cifras, clientes, testimonios, precios, fechas). Lo que no está en `src/content/*.json` no existe. Un valor `TODO…` no se publica: el esquema lo vuelve `null` y el componente oculta el elemento.
2. Nada de fotos de stock, personas falsas o imágenes generadas por IA. Sin foto → marcador de marca (`Photo.astro`).
3. Textos: "usted", primera persona del singular, sin rayas largas, sin emojis, sin las palabras prohibidas del manual (expertise, engagement, insights, potenciar, impulsar, soluciones integrales…). "Delta Fractional"/"Delta", nunca "DELTA" en texto ni "CFO" como nombre; "CFO fraccional" solo como palabra clave de SEO.
4. Color solo con variables de `src/styles/tokens.css` (no HEX en componentes). Naranja solo en acentos; texto naranja sobre claro siempre `--accent-text`; nunca texto blanco sobre naranja.
5. No tocar DNS, `main` ni la configuración de Pages sin aprobación de Daniel. Trabajo en ramas + PR + vista previa.

## Decisiones tomadas (2026-11-12)
- Fotos en `fotos/` (raíz), no en `public/`: Astro solo optimiza lo que está fuera de `public/`.
- Fuentes en `public/fonts/`; las `@font-face` se declaran en `Base.astro` con `BASE_URL` (la vista previa vive en una subcarpeta). Toda ruta a `public/` pasa por `ruta()` de `src/lib/enlaces.ts`.
- `features`, `contacto` y archivos de fotos salen siempre de `es.json`; `en.json` solo trae textos (con `needsReview: true` hasta que Natalia lo apruebe).
- Logo del header a 144 px: versión `descriptor-oscuro` (140–180 px). Nunca por debajo de 140 px.
- El build falla por un `alt` en `TODO` solo si el archivo de la foto existe.
- Página interna `/vista-interna/` (Astro no publica rutas que empiezan por `_`): `noindex`, fuera del sitemap.
- El enlace al aviso de privacidad se oculta hasta tener NIT, dirección y correo.
- Analítica: Umami Cloud. Formulario: Web3Forms, apagado (`features.formularioContacto`).

## Verificación
- `npm run build` y abrir `/`, `/en/` y `/vista-interna/` con `npm run preview`.
- Sin scroll horizontal de 320 a 1.440 px; capturas de página completa con `puppeteer-core` (Chrome sin interfaz no baja de ~500 px de ancho de ventana).

## Aprendizajes del proyecto
- **2026-11-12 — Pruebas con puppeteer bajo un header fijo:** `page.click(sel)` desplaza el elemento y hace clic en sus coordenadas; si queda debajo del header `sticky`, el clic cae en el header sin error (la casilla de autorización quedó sin marcar y el formulario "no enviaba"). En pruebas usar `page.$eval(sel, (e) => e.click())`. Y en scripts de edición con `String.replace`, `$$` en el texto de reemplazo se convierte en `$` (rompió `page.$$` en un script): usar una función de reemplazo. **Por qué importa:** ambos parecen fallos del sitio y no lo son.
- **2026-11-12 — `/_preview` no sirve en Astro:** las rutas que empiezan por `_` no se publican; además Jekyll (Pages en modo rama) ignora carpetas con `_` como `_astro/`. La vista previa que se sube a una rama `gh-pages` necesita `.nojekyll`. **Por qué importa:** sin eso la vista previa sale sin CSS ni imágenes.
