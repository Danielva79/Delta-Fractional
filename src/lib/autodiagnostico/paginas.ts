// Pantallas del cuestionario: las 6 secciones de cuestionario.ts se muestran en 3 pantallas de 2
// secciones. Es solo presentación: cuestionario.ts (compartido con la Edge Function) no cambia.
// El id de cada pantalla es el de su ÚLTIMA sección, porque es lo que se envía como ultimo_paso
// (la Edge Function y comercial.paso_orden solo conocen los ids de las secciones).
import { SECCIONES, type Seccion } from './cuestionario';

export interface Pagina {
  id: Seccion['id'];
  secciones: Seccion[];
}

const GRUPOS: Seccion['id'][][] = [
  ['calificacion', 'control'],
  ['caja', 'recurrencia'],
  ['costos', 'gobierno'],
];

export const PAGINAS: Pagina[] = GRUPOS.map((ids) => {
  const secciones = ids.map((id) => SECCIONES.find((s) => s.id === id)!);
  return { id: ids[ids.length - 1], secciones };
});

// Toda sección debe estar en exactamente una pantalla (si cambia el cuestionario, falla el build).
const repartidas = PAGINAS.flatMap((p) => p.secciones.map((s) => s.id));
if (repartidas.length !== SECCIONES.length || SECCIONES.some((s) => !repartidas.includes(s.id))) {
  throw new Error('paginas.ts: las pantallas no cubren todas las secciones de cuestionario.ts');
}

/** Pantalla que contiene una sección (para retomar sesiones guardadas con una pantalla por sección). */
export const paginaDeSeccion = (id: string) => PAGINAS.find((p) => p.secciones.some((s) => s.id === id));
