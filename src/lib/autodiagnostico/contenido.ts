// Textos del autodiagnóstico y de la política de datos: carga, validación y datos que faltan.
import { z } from 'astro/zod';
import textosJson from '../../content/autodiagnostico.json';
import politicaJson from '../../content/politica-datos.json';
import { texto, pendiente, explicarErrores } from '../../content/schema';
import type { Contenido } from '../contenido';

// Objeto estricto (detecta claves mal escritas), con _nota y needsReview opcionales.
const b = <T extends z.ZodRawShape>(forma: T) =>
  z.object({ ...forma, _nota: z.string().optional(), needsReview: z.boolean().optional() }).strict();
const nivel = b({ etiqueta: texto, texto });

const esquemaTextos = b({
  configuracion: b({
    agendaUrl: pendiente.refine((v) => v === null || /^https:\/\//.test(v), { message: 'debe empezar por https://' }),
    retencionDiasIncompletas: pendiente.refine((v) => v === null || /^[1-9][0-9]{0,3}$/.test(v), { message: 'debe ser un número de días' }),
    responsable: texto,
  }),
  meta: b({ title: texto, description: texto }),
  inicio: b({ antetitulo: texto, h1: texto, promesa: texto, detalle: texto, nota: texto, campoEmpresa: texto, errorEmpresa: texto, comenzar: texto }),
  navegacion: b({ progreso: texto, anterior: texto, siguiente: texto, verResultado: texto, errorSeccion: texto, errorPregunta: texto }),
  resultado: b({
    antetitulo: texto, titulo: texto, puntaje: texto,
    semaforo: b({ rojo: nivel, amarillo: nivel, verde: nivel }),
    dimensiones: texto, puntos: texto, inventarioNoAplica: texto,
    banderasTitulo: texto, banderasIntro: texto,
    rutaTitulo: texto, rutaNota: texto, rutaBase: b({ esencial: texto, estandar: texto }), rutaModuloA: texto, rutaModuloB: texto,
    notaVentas: texto, aviso: texto, cta: texto,
  }),
  contacto: b({
    titulo: texto, nombre: texto, correo: texto, whatsapp: texto, whatsappAyuda: texto, ciudad: texto,
    autorizacion: texto.refine((v) => v.includes('{politica}'), { message: 'debe incluir {politica} (el enlace a la política)' }),
    autorizacionEnlace: texto, versionAutorizacion: texto,
    enviar: texto, enviando: texto, exito: texto, error: texto, errorYaEnviado: texto, noDisponible: texto,
    errorRequerido: texto, errorCorreo: texto, errorWhatsapp: texto, errorAutorizacion: texto, errorVerificacion: texto, resumenErrores: texto,
  }),
});

const esquemaPolitica = b({
  borrador: z.boolean(),
  titulo: texto,
  avisoRevision: texto,
  vigencia: pendiente,
  secciones: z.array(z.object({ h2: texto, parrafos: z.array(texto).optional(), lista: z.array(texto).optional() }).strict()).min(1),
});

function validar<S extends z.ZodType>(esquema: S, datos: unknown, archivo: string): z.infer<S> {
  const r = esquema.safeParse(datos);
  if (!r.success) throw new Error(explicarErrores(archivo, r.error));
  return r.data;
}

export const textosAD = validar(esquemaTextos, textosJson, 'src/content/autodiagnostico.json');
export const politica = validar(esquemaPolitica, politicaJson, 'src/content/politica-datos.json');
export type TextosAD = typeof textosAD;

export const RUTA_AUTODIAGNOSTICO = '/autodiagnostico/';
export const RUTA_POLITICA = '/politica-datos/';

/** Conexión con la Edge Function (variables de entorno públicas; sin ellas no se guarda nada). */
export const conexion = {
  url: import.meta.env.PUBLIC_AUTODIAGNOSTICO_URL || '',
  llave: import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  turnstile: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '',
};

const pendienteMarca = (q: string) => `[PENDIENTE: ${q}]`;

/** Reemplaza las variables de la política y del texto de autorización. Lo que falta queda marcado. */
export function rellenarPolitica(t: string, c: Contenido): string {
  return t
    .replaceAll('{responsable}', textosAD.configuracion.responsable)
    .replaceAll('{identificacion}', c.contacto.nit ?? pendienteMarca('identificación'))
    .replaceAll('{direccion}', c.contacto.direccionFiscal ?? pendienteMarca('dirección'))
    .replaceAll('{correo}', c.contacto.correo ?? pendienteMarca('correo'))
    .replaceAll('{whatsapp}', c.contacto.whatsappNumero)
    .replaceAll('{retencion}', textosAD.configuracion.retencionDiasIncompletas ?? pendienteMarca('plazo de retención'))
    .replaceAll('{vigencia}', politica.vigencia ?? pendienteMarca('fecha de entrada en vigor'));
}

/** Lo que falta para publicar el autodiagnóstico en producción (lo revisa scripts/revisar.mjs --lanzamiento). */
export function faltantesAutodiagnostico(c: Contenido): string[] {
  const f: string[] = [];
  if (politica.borrador) f.push('política de datos en BORRADOR (borrador: false en politica-datos.json tras la revisión jurídica)');
  if (!c.contacto.nit) f.push('identificación del responsable (contacto.nit en es.json)');
  if (!c.contacto.correo) f.push('correo de contacto (contacto.correo en es.json)');
  if (!c.contacto.direccionFiscal) f.push('dirección (contacto.direccionFiscal en es.json)');
  if (!politica.vigencia) f.push('vigencia de la política (politica-datos.json)');
  if (!textosAD.configuracion.retencionDiasIncompletas) f.push('plazo de retención (configuracion.retencionDiasIncompletas)');
  if (!conexion.url) f.push('variable PUBLIC_AUTODIAGNOSTICO_URL');
  if (!conexion.llave) f.push('variable PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  if (!conexion.turnstile) f.push('variable PUBLIC_TURNSTILE_SITE_KEY');
  return f;
}
