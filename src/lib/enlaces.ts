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

/**
 * "Agendar diagnóstico" (el diagnóstico financiero, que es pago) abre WhatsApp con su mensaje.
 * contacto.diagnosticoUrl es del cuestionario de 15 preguntas, que es otro producto: ver cuestionario().
 */
export function diagnostico(c: Contenido) {
  return whatsapp(c, c.contacto.whatsappMensajeDiagnostico);
}

/** URL del cuestionario de 15 preguntas (solo existe con cuestionario.activo; contenido.ts lo exige). */
export function cuestionario(c: Contenido) {
  return c.contacto.diagnosticoUrl ?? diagnostico(c);
}

export const esExterno = (href: string) => /^https?:\/\//.test(href);
