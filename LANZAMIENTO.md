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

## 2b. Autodiagnóstico (/autodiagnostico/)

El autodiagnóstico guarda las respuestas en el proyecto de Supabase de Delta BI (esquema `comercial`,
Edge Function `autodiagnostico-guardar`, rama `comercial/autodiagnostico` de Danielva79/delta-bi; pasos
de despliegue en su `docs/autodiagnostico.md`). Al publicar en `main`, el workflow corre
`node scripts/revisar.mjs --lanzamiento` y **no publica** si con `features.autodiagnostico` en `true` falta algo:

- la política de datos revisada por un abogado (`borrador: false` y `vigencia` en `src/content/politica-datos.json`);
- `contacto.nit` (identificación), `contacto.correo` y `contacto.direccionFiscal` en `es.json`;
- `configuracion.retencionDiasIncompletas` en `src/content/autodiagnostico.json` (el mismo número del secret `RETENCION_DIAS_INCOMPLETAS`);
- las variables de GitHub `PUBLIC_AUTODIAGNOSTICO_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `PUBLIC_TURNSTILE_SITE_KEY`.

Opcional: `configuracion.agendaUrl` (enlace de la agenda; sin él, "Agende su diagnóstico financiero" lleva al formulario).

Para lanzar el sitio antes que el autodiagnóstico: `features.autodiagnostico` y `cuestionario.activo` en `false`
en `es.json` (desaparecen la página, la política, el enlace del menú y la banda vuelve al diagnóstico).

## 3. Después del lanzamiento

- Google Search Console: verificar `deltafractional.com` y enviar `https://deltafractional.com/sitemap.xml`.
- Probar los datos estructurados en https://search.google.com/test/rich-results con `https://deltafractional.com/`.
- Umami Cloud: crear el sitio, poner su ID en la variable `PUBLIC_UMAMI_WEBSITE_ID` de GitHub y marcar como objetivos `cta_diagnostico_click`, `cta_whatsapp_click` y `form_submit_success`.
- Borrar de la raíz del repo los archivos del sitio viejo (`index.html`, `index-en.html`), que ya no se publican.

## 4. Datos pendientes (no se publican hasta tenerlos)

| Dato | Dónde se escribe | Qué habilita |
|---|---|---|
| Captura de Delta BI con cifras que no sean de un cliente | `fotos/delta-bi-captura.png` y `fotos/delta-bi-captura-movil.png` + `features.capturaDeltaBI` | la captura con marco y la leyenda "Datos de una empresa ficticia" (el código ya está listo) |
| Cuestionario de 15 preguntas: nombre, frase y URL | `cuestionario` en `es.json` y `en.json` + `contacto.diagnosticoUrl` + `cuestionario.activo` | la banda presenta el cuestionario en vez del diagnóstico |
| Correo de contacto | `contacto.correo` | pie, política de datos y formulario |
| NIT y dirección | `contacto.nit`, `contacto.direccionFiscal` | política de datos |
| Política de datos revisada, identificación, retención, agenda y llaves del autodiagnóstico | ver la sección 2b | /autodiagnostico/ en producción |
| Clave de Web3Forms | variable `PUBLIC_WEB3FORMS_KEY` + `features.formularioContacto` | formulario de contacto |
| Si el precio incluye IVA | `servicios.inversion.iva` | la nota del IVA junto al precio |
| Duración del diagnóstico | `servicios.items[0].duracion` | se muestra en la tarjeta |
| Resultado tipo de "Proyectos" | `servicios.items[2].resultado` | se muestra en la tarjeta |
| Tamaño de empresa y sectores | `segmento` | (reservado para una sección futura) |
| Caso y testimonios (con permiso) | `caso`, `testimonios` + sus banderas | prueba social (los logos de clientes ya están publicados) |
| Nombre y módulos del curso | `curso` + `features.curso` | tarjeta del curso |

## 5. Textos nuevos por aprobar

Redactados durante el rediseño, fuera del contenido aprobado:

- Formulario (`formulario` en `es.json` / `en.json`): título "O déjeme sus datos y le escribo", botón "Enviar" y mensajes de error.
- Autodiagnóstico: las aclaraciones de las preguntas (`src/lib/autodiagnostico/cuestionario.ts`), los textos por nivel del semáforo, las alertas, la nota de ventas, los mensajes y la autorización (`src/content/autodiagnostico.json`), la banda de inicio (`cuestionario` en `es.json`) y la política de datos (`src/content/politica-datos.json`, BORRADOR para revisión jurídica).
- Página 404: "Esta página no existe." / "Ir al inicio".
- El aviso de privacidad aparte (`/privacidad/`) se retiró el 19-nov-2026: la única política es `/politica-datos/` (`politica-datos.json`), que también cubre Umami, Turnstile y Supabase. Si se activa Web3Forms, agregarlo a sus proveedores.
- Traducción completa al inglés (`en.json`): revisión de Natalia.
