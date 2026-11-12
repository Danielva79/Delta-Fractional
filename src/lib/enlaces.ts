// Enlaces del sitio: rutas con la base correcta, WhatsApp y CTA del diagnóstico.
import type { Contenido, Idioma } from './contenido';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Ruta a un archivo de /public respetando la base (vista previa en subcarpeta). */
export const ruta = (p: string) => `${BASE}${p.startsWith('/') ? p : `/${p}`}`;

/** Inicio de cada idioma. */
export const inicio = (idioma: Idioma) => ruta(idioma === 'es' ? '/' : '/en/');

/** URL absoluta (canonical, hreflang, OG). */
export const absoluta = (p: string, site: URL | undefined) => new URL(p, site ?? 'https://deltafractional.com').href;

export function whatsapp(c: Contenido, mensaje: string = c.contacto.whatsappMensaje) {
  return `${c.contacto.whatsappUrlBase}?text=${encodeURIComponent(mensaje)}`;
}

/** Mientras no exista la URL del diagnóstico, el CTA abre WhatsApp con el mensaje del diagnóstico. */
export function diagnostico(c: Contenido) {
  return c.contacto.diagnosticoUrl ?? whatsapp(c, c.contacto.whatsappMensajeDiagnostico);
}

export const esExterno = (href: string) => /^https?:\/\//.test(href);
