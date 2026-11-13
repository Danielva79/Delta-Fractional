// Esquema del contenido del sitio (es.json y en.json).
// - "texto": obligatorio; si queda en "TODO..." el build falla.
// - "pendiente": puede quedar en "TODO..."; en ese caso se convierte en null
//   y el componente oculta el elemento. Nunca se publica la palabra TODO.
import { z } from 'astro/zod';

export const esTodo = (v: string) => /^\s*TODO/i.test(v);

const texto = z
  .string()
  .min(1)
  .refine((v) => !esTodo(v), { message: 'este texto es obligatorio y no puede quedar en "TODO"' });
const pendiente = z.string().transform((v) => (esTodo(v) || v.trim() === '' ? null : v));
const url = texto.refine((v) => /^https:\/\//.test(v), { message: 'debe ser una URL que empiece por https://' });
const urlPendiente = z
  .string()
  .transform((v) => (esTodo(v) || v.trim() === '' ? null : v))
  .refine((v) => v === null || /^https:\/\//.test(v), { message: 'debe ser una URL que empiece por https://' });

/** alt de una foto: "" = decorativa (se respeta); "TODO..." = pendiente (null). */
const altFoto = z.string().transform((v) => (esTodo(v) ? null : v));

/** Objeto estricto (detecta claves mal escritas) con la marca opcional de revisión. */
const bloque = <T extends z.ZodRawShape>(forma: T) =>
  z.object({ ...forma, needsReview: z.boolean().optional() }).strict();

const idFoto = z.enum(['hero-retrato', 'sobre-daniel', 'trabajo-cliente', 'banda-detalle', 'delta-bi-captura', 'curso']);
export type IdFoto = z.infer<typeof idFoto>;

// ---------- Textos (iguales en los dos idiomas) ----------
const textos = {
  _nota: z.string().optional(),
  meta: bloque({ lang: texto, title: texto, description: texto, ogImage: texto, ogImageAlt: texto }),
  marca: bloque({ nombre: texto, nombreCorto: texto, persona: texto, cargo: texto, ubicacion: texto }),
  nav: z.array(bloque({ label: texto, href: texto })).min(1),
  ctaPrincipal: texto,
  ctaWhatsApp: texto,
  hero: bloque({ antetitulo: texto, h1: texto, h1Resaltado: texto, subtitulo: texto, foto: idFoto }),
  prueba: bloque({ items: z.array(bloque({ cifra: texto.nullable(), texto })).min(1) }),
  problema: bloque({
    h2: texto,
    intro: texto,
    dolores: z.array(bloque({ titulo: texto, texto })).min(1),
    cierre: texto,
  }),
  servicios: bloque({
    h2: texto,
    items: z
      .array(
        bloque({
          id: texto,
          nivel: texto,
          titulo: texto,
          texto,
          resultado: pendiente.optional(),
          duracion: pendiente.optional(),
          precio: pendiente.optional(),
        }),
      )
      .min(1),
    inversion: bloque({ precio: texto, nota: texto, iva: pendiente }),
  }),
  diferencial: bloque({ h2: texto, pilares: z.array(bloque({ titulo: texto, texto })).min(1) }),
  deltaBI: bloque({ h2: texto, texto, nota: texto, captura: idFoto, leyenda: texto, verCompleta: texto }),
  sobre: bloque({ h2: texto, parrafos: z.array(texto).min(1), foto: idFoto, linkedinLabel: texto }),
  diagnostico: bloque({ antetitulo: texto, h2: texto, texto, cta: texto, fondo: idFoto }),
  curso: bloque({ nombre: pendiente, modulos: pendiente, url: urlPendiente }),
  caso: bloque({ titulo: pendiente, antes: pendiente, queHice: pendiente, despues: pendiente }),
  testimonios: z.array(
    bloque({ nombre: texto, cargo: texto, empresa: texto, texto, foto: z.string().optional() }),
  ),
  logosClientes: z.array(bloque({ nombre: texto, archivo: texto })),
  segmento: bloque({ tamanoEmpresa: pendiente, sectores: pendiente }),
  faq: bloque({ h2: texto, items: z.array(bloque({ p: texto, r: texto })).min(1) }),
  cierre: bloque({ h2: texto, texto }),
  formulario: bloque({
    titulo: texto, nombre: texto, empresa: texto, cargo: texto, telefono: texto, correo: texto, mensaje: texto,
    autorizacionAntes: texto, autorizacionEnlace: texto, enviar: texto, enviando: texto, exito: texto, error: texto,
    errorRequerido: texto, errorCorreo: texto, errorTelefono: texto, errorAutorizacion: texto, errorRapido: texto,
    resumenErrores: texto,
  }),
  footer: bloque({ linea: texto, privacidad: texto }),
  ui: bloque({
    saltar: texto,
    menuAbrir: texto,
    menuCerrar: texto,
    navPrincipal: texto,
    idioma: texto,
    resultado: texto,
    pestanaNueva: texto,
    inicio: texto,
    trayectoria: texto,
    casoAntes: texto,
    casoQueHice: texto,
    casoDespues: texto,
    testimonios: texto,
    clientes: texto,
    curso: texto,
  }),
};

// ---------- Solo en es.json (datos que valen para los dos idiomas) ----------
const foto = bloque({
  archivo: texto.refine((v) => /^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(v), {
    message: 'el nombre del archivo va en minúsculas, sin espacios, y termina en .jpg, .png o .webp',
  }),
  ratio: texto.refine((v) => /^\d+\/\d+$/.test(v), { message: 'la proporción va como "4/5"' }),
  min: texto,
  tratamiento: z.enum(['natural', 'duotono', 'ninguno']),
  // El alt puede estar pendiente mientras la foto no exista. Si la foto existe y el alt
  // sigue en TODO, el build falla (ver src/components/Photo.astro).
  alt: altFoto,
  placeholder: texto.nullable(),
  /** Recorte (object-position), p. ej. "50% 30%". */
  posicion: texto.optional(),
  /** Proporción en móvil (≤ 900 px) si cambia, p. ej. "4/5". */
  ratioMovil: texto.refine((v) => /^\d+\/\d+$/.test(v), { message: 'la proporción va como "4/5"' }).optional(),
  /** Otro recorte del mismo slot para móvil (≤ 900 px), servido con <source media>. */
  archivoMovil: texto.refine((v) => /^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(v), {
    message: 'el nombre del archivo va en minúsculas, sin espacios, y termina en .jpg, .png o .webp',
  }).optional(),
  /** "contain" muestra la imagen completa (capturas); "cover" recorta (fotos). */
  ajuste: z.enum(['cover', 'contain']).optional(),
});

export const esquemaES = z
  .object({
    ...textos,
    contacto: bloque({
      whatsappNumero: texto,
      whatsappUrlBase: url,
      whatsappMensaje: texto,
      whatsappMensajeDiagnostico: texto,
      linkedin: url,
      correo: pendiente,
      diagnosticoUrl: urlPendiente,
      nit: pendiente,
      direccionFiscal: pendiente,
    }),
    features: bloque({
      formularioContacto: z.boolean(),
      caso: z.boolean(),
      testimonios: z.boolean(),
      logosClientes: z.boolean(),
      curso: z.boolean(),
      capturaDeltaBI: z.boolean(),
      _nota: z.string().optional(),
    }),
    fotos: z.record(idFoto, foto),
    // Cuestionario de 15 preguntas: otro producto, con nombre propio. Su URL es contacto.diagnosticoUrl.
    cuestionario: bloque({ _nota: z.string().optional(), activo: z.boolean(), nombre: pendiente, texto: pendiente, cta: texto }),
  })
  .strict();

export const esquemaEN = z
  .object({
    ...textos,
    contacto: bloque({ whatsappMensaje: texto, whatsappMensajeDiagnostico: texto }),
    fotos: z.record(idFoto, bloque({ alt: altFoto })),
    cuestionario: bloque({ nombre: pendiente, texto: pendiente, cta: texto }),
  })
  .strict();

// ---------- Aviso de privacidad (privacidad.es.json / privacidad.en.json) ----------
export const esquemaPrivacidad = z
  .object({
    _nota: z.string().optional(),
    needsReview: z.boolean().optional(),
    titulo: texto,
    avisoRevision: texto,
    vigencia: pendiente,
    secciones: z
      .array(
        z
          .object({ h2: texto, parrafos: z.array(texto).optional(), lista: z.array(texto).optional() })
          .strict()
          .refine((s) => s.parrafos || s.lista, { message: 'cada sección necesita "parrafos" o "lista"' }),
      )
      .min(1),
  })
  .strict();
export type Privacidad = z.infer<typeof esquemaPrivacidad>;

export type ContenidoES = z.infer<typeof esquemaES>;
export type ContenidoEN = z.infer<typeof esquemaEN>;

/** Convierte los errores de zod en un mensaje claro en español. */
export function explicarErrores(archivo: string, error: z.ZodError): string {
  const lineas = error.issues.map((i) => {
    const ruta = i.path.length ? i.path.join('.') : '(raíz del archivo)';
    let motivo = i.message;
    if (i.code === 'invalid_type') {
      motivo = /received undefined/.test(i.message)
        ? 'falta esta clave obligatoria'
        : `tipo de dato equivocado (se esperaba ${i.expected})`;
    } else if (i.code === 'unrecognized_keys') {
      motivo = `clave desconocida (¿mal escrita?): ${i.keys.join(', ')}`;
    } else if (i.code === 'too_small') {
      motivo = 'no puede estar vacío';
    } else if (i.code === 'invalid_value') {
      motivo = `valor no permitido; opciones: ${i.values.join(', ')}`;
    }
    return `  · ${ruta}: ${motivo}`;
  });
  return `\n\nEl contenido de ${archivo} tiene ${lineas.length} error(es):\n${lineas.join('\n')}\n\nCorrija el archivo y vuelva a publicar. Guía: CONTENIDO.md\n`;
}
