// Configuración de Astro para deltafractional.com
// - Salida estática (HTML sin JavaScript por defecto).
// - Español en "/" (sin prefijo) e inglés en "/en/".
// - BASE_PATH permite construir la vista previa bajo una subcarpeta
//   (p. ej. /delta-fractional-preview/) sin tocar el código.
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_SITE_URL || 'https://deltafractional.com';
const base = process.env.BASE_PATH || '/';
// OUT_DIR permite construir la vista previa en otra carpeta sin pisar dist/.
const outDir = process.env.OUT_DIR || './dist';

export default defineConfig({
  site,
  base,
  outDir,
  trailingSlash: 'always',
  output: 'static',
  // CSS en archivos con hash (≈7 KB comprimido). Medido con Lighthouse móvil, 3 corridas: en línea
  // pinta antes (LCP 1,14 s vs 1,37 s) pero sube el bloqueo (TBT 170-240 ms) y baja Rendimiento a 91-98;
  // en archivos queda en 98-100 con TBT 80-150 ms. Las dos opciones cumplen LCP ≤ 2,0 s.
  build: { format: 'directory', inlineStylesheets: 'never' },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  image: {
    // Calidad pensada para fotos de máximo ~250 KB en el ancho mayor.
    service: { config: { avif: { quality: 55 }, webp: { quality: 72 }, jpeg: { quality: 76 } } },
  },
});
