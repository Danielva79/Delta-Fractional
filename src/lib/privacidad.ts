// Aviso de privacidad: carga, validación y estado.
// La página pública se genera solo cuando el aviso está completo (NIT, dirección, correo y vigencia).
import es from '../content/privacidad.es.json';
import en from '../content/privacidad.en.json';
import { esquemaPrivacidad, explicarErrores, type Privacidad } from '../content/schema';
import type { Contenido, Idioma } from './contenido';

function validar(datos: unknown, archivo: string): Privacidad {
  const r = esquemaPrivacidad.safeParse(datos);
  if (!r.success) throw new Error(explicarErrores(archivo, r.error));
  return r.data;
}
const textos: Record<Idioma, Privacidad> = {
  es: validar(es, 'src/content/privacidad.es.json'),
  en: validar(en, 'src/content/privacidad.en.json'),
};

export const avisoPrivacidad = (idioma: Idioma) => textos[idioma];

/** Datos que el aviso necesita y todavía faltan. */
export function faltantesPrivacidad(c: Contenido): string[] {
  const faltan: string[] = [];
  if (!c.contacto.nit) faltan.push('NIT (contacto.nit en es.json)');
  if (!c.contacto.direccionFiscal) faltan.push('dirección (contacto.direccionFiscal en es.json)');
  if (!c.contacto.correo) faltan.push('correo (contacto.correo en es.json)');
  if (!textos.es.vigencia || !textos.en.vigencia) faltan.push('fecha de entrada en vigor (vigencia en privacidad.es.json y privacidad.en.json)');
  return faltan;
}
export const privacidadLista = (c: Contenido) => faltantesPrivacidad(c).length === 0;

export const rutaPrivacidad = (idioma: Idioma) => (idioma === 'es' ? '/privacidad/' : '/en/privacy/');

/** Reemplaza {nit} {direccion} {correo} {whatsapp} {vigencia}. Lo que falta se marca (solo en la vista interna). */
export function rellenar(texto: string, c: Contenido, vigencia: string | null): string {
  const pendiente = (q: string) => `[PENDIENTE: ${q}]`;
  return texto
    .replaceAll('{nit}', c.contacto.nit ?? pendiente('NIT'))
    .replaceAll('{direccion}', c.contacto.direccionFiscal ?? pendiente('dirección'))
    .replaceAll('{correo}', c.contacto.correo ?? pendiente('correo'))
    .replaceAll('{whatsapp}', c.contacto.whatsappNumero)
    .replaceAll('{vigencia}', vigencia ?? pendiente('fecha de entrada en vigor'));
}
