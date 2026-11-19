// Política de tratamiento de datos: una sola, en /politica-datos/ (solo en español), la misma que
// autoriza el autodiagnóstico. El antiguo aviso /privacidad/ (privacidad.es.json / .en.json) se retiró
// el 19-nov-2026 para no tener dos textos. Si se activa el formulario de Web3Forms, agregue Web3Forms
// a "Proveedores" en politica-datos.json antes de publicarlo.
import type { Contenido, Idioma } from './contenido';
import { politica, RUTA_POLITICA } from './autodiagnostico/contenido';

/** Datos que la política necesita y todavía faltan. */
export function faltantesPrivacidad(c: Contenido): string[] {
  const faltan: string[] = [];
  if (!c.contacto.nit) faltan.push('identificación (contacto.nit en es.json)');
  if (!c.contacto.direccionFiscal) faltan.push('dirección (contacto.direccionFiscal en es.json)');
  if (!c.contacto.correo) faltan.push('correo (contacto.correo en es.json)');
  if (politica.borrador) faltan.push('política en borrador (borrador en politica-datos.json)');
  if (!politica.vigencia) faltan.push('vigencia (politica-datos.json)');
  return faltan;
}
export const privacidadLista = (c: Contenido) => faltantesPrivacidad(c).length === 0;

/** La política solo existe en español; la versión en inglés del sitio enlaza la misma página. */
export const rutaPrivacidad = (_idioma: Idioma) => RUTA_POLITICA;
