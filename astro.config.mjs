// Configuración de Astro para deltafractional.com
// - Salida estática (HTML sin JavaScript por defecto).
// - Español en "/" (sin prefijo) e inglés en "/en/".
// - BASE_PATH permite construir la vista previa bajo una subcarpeta
//   (p. ej. /delta-fractional-preview/) sin tocar el código.
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_SITE_URL || 'https://deltafractional.com';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
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
