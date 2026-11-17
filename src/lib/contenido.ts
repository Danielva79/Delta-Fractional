// Carga y valida el contenido. Se ejecuta en el build: si hay un error, el build falla.
import es from '../content/es.json';
import en from '../content/en.json';
import { esquemaES, esquemaEN, explicarErrores, type ContenidoES } from '../content/schema';
import type { z } from 'astro/zod';

export type Idioma = 'es' | 'en';
export const IDIOMAS: Idioma[] = ['es', 'en'];
export type Contenido = ContenidoES & { idioma: Idioma };

function validar<S extends z.ZodType>(esquema: S, datos: unknown, archivo: string): z.infer<S> {
  const r = esquema.safeParse(datos);
  if (!r.success) throw new Error(explicarErrores(archivo, r.error));
  return r.data;
}

const ES = validar(esquemaES, es, 'src/content/es.json');
const EN = validar(esquemaEN, en, 'src/content/en.json');

// El cuestionario solo se publica completo: nombre, frase y URL en español. En inglés es opcional:
// sin nombre y frase en en.json, la banda en inglés sigue mostrando el diagnóstico financiero
// (el autodiagnóstico existe solo en español).
if (ES.cuestionario.activo) {
  const faltan = [
    !ES.contacto.diagnosticoUrl && 'es.json contacto.diagnosticoUrl',
    !ES.cuestionario.nombre && 'es.json cuestionario.nombre',
    !ES.cuestionario.texto && 'es.json cuestionario.texto',
  ].filter(Boolean);
  if (faltan.length) {
    throw new Error(`\n\ncuestionario.activo está en true, pero faltan: ${faltan.join(', ')}.\nComplételos o deje activo en false. Guía: CONTENIDO.md\n`);
  }
}

// Con features.autodiagnostico en false, el enlace del menú desaparece.
const navES = ES.nav.filter((n) => ES.features.autodiagnostico || n.href !== '/autodiagnostico/');

const porIdioma: Record<Idioma, Contenido> = {
  es: { ...ES, nav: navES, idioma: 'es' },
  en: {
    ...EN,
    idioma: 'en',
    // Datos que no dependen del idioma: siempre salen de es.json.
    features: ES.features,
    ctaAutodiagnostico: ES.ctaAutodiagnostico, // no se usa en inglés (sin autodiagnóstico)
    ctaAgendarCita: ES.ctaAgendarCita, // ídem
    // Los logos son nombres propios: la lista sale de es.json.
    logosClientes: ES.logosClientes,
    cuestionario: { ...EN.cuestionario, activo: ES.cuestionario.activo },
    contacto: { ...ES.contacto, ...EN.contacto },
    fotos: Object.fromEntries(
      Object.entries(ES.fotos).map(([id, f]) => [id, { ...f, alt: EN.fotos[id as keyof typeof EN.fotos].alt }]),
    ) as ContenidoES['fotos'],
  },
};

export function contenido(idioma: Idioma): Contenido {
  return porIdioma[idioma];
}
