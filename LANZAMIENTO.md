# Lanzamiento del rediseño

## 1. Revisión (antes de tocar producción)

- Vista previa: https://danielva79.github.io/delta-fractional-preview/ (en inglés: `/en/`; revisión interna: `/vista-interna/`).
- Daniel revisa el sitio en el celular y en el computador.
- Natalia revisa el inglés en `/vista-interna/` (tabla ES / EN) y aprueba cada bloque cambiando `needsReview` a `false` en `src/content/en.json`.
- Para actualizar la vista previa después de un cambio: `npm run vista-previa` (1 a 2 minutos).

## 2. Paso a producción (solo con la aprobación de Daniel)

El sitio actual se sigue viendo hasta el paso 3: GitHub Pages lo sirve desde los archivos `index.html` e `index-en.html` de la raíz de `main`, que esta rama no toca.

1. Fusionar el pull request de `rediseno-marca` en `main`. El workflow "Publicar sitio" construye y revisa, pero todavía no publica: Pages aún está en modo rama.
2. En GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. En **Actions → Publicar sitio → Run workflow** (rama `main`). En 1 a 2 minutos queda en línea el sitio nuevo.
4. En **Settings → Pages**, confirmar que el dominio personalizado sigue en `deltafractional.com` y que **Enforce HTTPS** está marcado. El DNS no se toca.
5. Verificar: `https://deltafractional.com/`, `/en/`, `/index-en.html` (debe llevar a `/en/`), `/robots.txt`, `/sitemap.xml`.

Entre los pasos 2 y 3 puede haber uno o dos minutos en que GitHub cambia de modo: conviene hacerlos seguidos.

**Volver atrás:** en Settings → Pages, Source → "Deploy from a branch", rama `main`, carpeta `/ (root)`. Vuelve a servir los archivos viejos de la raíz.

## 3. Después del lanzamiento

- Google Search Console: verificar `deltafractional.com` y enviar `https://deltafractional.com/sitemap.xml`.
- Probar los datos estructurados en https://search.google.com/test/rich-results con `https://deltafractional.com/`.
- Umami Cloud: crear el sitio, poner su ID en la variable `PUBLIC_UMAMI_WEBSITE_ID` de GitHub y marcar como objetivos `cta_diagnostico_click`, `cta_whatsapp_click` y `form_submit_success`.
- Borrar de la raíz del repo los archivos del sitio viejo (`index.html`, `index-en.html`), que ya no se publican.

## 4. Datos pendientes (no se publican hasta tenerlos)

| Dato | Dónde se escribe | Qué habilita |
|---|---|---|
| Fotos reales (6 espacios) | carpeta `fotos/` + `alt` en `es.json` y `en.json` | reemplaza los marcadores |
| Captura de Delta BI con datos de ejemplo | `fotos/delta-bi-captura.png` + `features.capturaDeltaBI` | la imagen en la sección Delta BI |
| URL del diagnóstico de 15 preguntas | `contacto.diagnosticoUrl` | los botones dejan de abrir WhatsApp |
| Correo de contacto | `contacto.correo` | pie, aviso de privacidad y formulario |
| NIT y dirección | `contacto.nit`, `contacto.direccionFiscal` | aviso de privacidad |
| Fecha de entrada en vigor del aviso | `vigencia` en `privacidad.es.json` y `privacidad.en.json` | aviso de privacidad (después de revisión del abogado) |
| Clave de Web3Forms | variable `PUBLIC_WEB3FORMS_KEY` + `features.formularioContacto` | formulario de contacto |
| Si el precio incluye IVA | `servicios.inversion.iva` | la nota del IVA junto al precio |
| Duración del diagnóstico | `servicios.items[0].duracion` | se muestra en la tarjeta |
| Resultado tipo de "Proyectos" | `servicios.items[2].resultado` | se muestra en la tarjeta |
| Tamaño de empresa y sectores | `segmento` | (reservado para una sección futura) |
| Caso, testimonios, logos de clientes (con permiso) | `caso`, `testimonios`, `logosClientes` + sus banderas | prueba social |
| Nombre y módulos del curso | `curso` + `features.curso` | tarjeta del curso |

## 5. Textos nuevos por aprobar

Redactados durante el rediseño, fuera del contenido aprobado:

- Formulario (`formulario` en `es.json` / `en.json`): título "O déjeme sus datos y le escribo", botón "Enviar" y mensajes de error.
- Página 404: "Esta página no existe." / "Ir al inicio".
- Aviso de privacidad completo (`privacidad.es.json` / `privacidad.en.json`): texto base para revisión de un abogado.
- Traducción completa al inglés (`en.json`): revisión de Natalia.
