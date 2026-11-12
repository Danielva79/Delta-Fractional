# Cómo cambiar el contenido del sitio

Todo el texto del sitio vive en dos archivos. No hace falta tocar código.

| Qué quiere cambiar | Archivo | Dónde |
|---|---|---|
| Cualquier texto en español (titular, servicios, preguntas…) | `src/content/es.json` | la sección con el mismo nombre (`hero`, `servicios`, `faq`…) |
| El mismo texto en inglés | `src/content/en.json` | la misma sección |
| Precio y nota del precio | los dos archivos | `servicios.inversion` y `faq` |
| WhatsApp, LinkedIn, correo, NIT, URL del diagnóstico | `src/content/es.json` | `contacto` (valen para los dos idiomas) |
| Mostrar u ocultar una sección futura | `src/content/es.json` | `features` |
| Una foto | carpeta `fotos/` + `fotos` en los dos archivos | ver abajo |

## Cómo publicar un cambio

1. En GitHub, abra el archivo, toque el lápiz ("Edit"), cambie el texto y guarde ("Commit changes").
2. GitHub construye y publica el sitio solo, en 1 a 2 minutos.
3. Si algo está mal escrito (una clave borrada, un texto obligatorio vacío), **el sitio no se publica** y GitHub muestra en rojo qué línea revisar. El sitio anterior sigue en línea.

Cuide las comillas y las comas del archivo: cada texto va entre comillas `"…"` y separado del siguiente con una coma.

## Datos pendientes ("TODO")

Un valor que empieza por `TODO` es un dato que falta (por ejemplo `"correo": "TODO:correo-de-contacto"`). El sitio **nunca** lo muestra: oculta ese elemento. Para publicarlo, reemplace el `TODO…` por el dato real.

Los textos principales (titular, servicios, preguntas) no pueden quedar en `TODO`: si pasa, el build se detiene con un aviso.

## Cómo cambiar o agregar una foto (3 pasos)

1. Guarde la foto en la carpeta `fotos/` con el nombre exacto de su espacio, en minúsculas y sin espacios:

   | Espacio | Archivo | Proporción | Tamaño mínimo |
   |---|---|---|---|
   | Hero (retrato) | `hero-retrato.jpg` | 4:5 vertical | 1.600 × 2.000 px |
   | Sobre mí | `sobre-daniel.jpg` | 3:2 horizontal | 2.400 × 1.600 px |
   | Trabajo con un cliente | `trabajo-cliente.jpg` | 3:2 horizontal | 2.400 × 1.600 px |
   | Fondo de la banda del diagnóstico | `banda-detalle.jpg` | 16:9 | 2.400 × 1.350 px (se pone en duotono carbón) |
   | Captura de Delta BI | `delta-bi-captura.png` | 16:10 | 2.400 × 1.500 px, con datos de ejemplo |
   | Curso | `curso.jpg` | 16:9 | 2.400 × 1.350 px |

2. Escriba qué muestra la foto en `fotos.<espacio>.alt`, en `es.json` y en `en.json` (por ejemplo `"Daniel Villegas en su oficina en Manizales"`). Es el texto que leen los lectores de pantalla y Google. **Si la foto existe y su `alt` sigue en `TODO`, el sitio no se publica.**
3. Publique. El sitio genera solo las versiones livianas (AVIF y WebP en 4 tamaños) y reemplaza el marcador.

Mientras una foto no exista, se ve un marcador con la marca (fondo carbón, alas y chevrón), sin texto. El espacio tiene el tamaño de la foto, así que nada se mueve cuando llega.

No use fotos de stock, de personas que no sean reales ni generadas con IA.

## Cómo activar una sección oculta

En `src/content/es.json`, dentro de `features`, cambie `false` por `true` **solo cuando su contenido real esté completo y aprobado**:

| Bandera | Qué muestra | Qué necesita antes |
|---|---|---|
| `caso` | Caso antes / qué hice / después | `caso` completo, con cifras reales y permiso del cliente |
| `testimonios` | Testimonios | `testimonios` con nombre, cargo, empresa y permiso |
| `logosClientes` | Logos de clientes en la barra de prueba | `logosClientes` y los SVG, con permiso |
| `curso` | Tarjeta del curso en Recursos | `curso.nombre` y `curso.modulos` |
| `capturaDeltaBI` | Captura en la sección Delta BI | `fotos/delta-bi-captura.png` |
| `formularioContacto` | Formulario de contacto en el cierre | aviso de privacidad completo (NIT, dirección, correo) y la clave de Web3Forms |

Puede ver cómo se verán estas secciones, con datos de ejemplo, en la página interna `/vista-interna/` (no aparece en Google).
