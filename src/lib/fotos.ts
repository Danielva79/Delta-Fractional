// Fotos reales: se buscan en la carpeta /fotos (raíz del repo) durante el build.
import type { ImageMetadata } from 'astro';
import type { Contenido } from './contenido';
import type { IdFoto } from '../content/schema';

const archivos = import.meta.glob<{ default: ImageMetadata }>('/fotos/*.{jpg,jpeg,png,webp}', { eager: true });

/** Imagen del slot si su archivo existe; si no, undefined. */
export function imagenDe(c: Contenido, id: IdFoto): ImageMetadata | undefined {
  return archivos[`/fotos/${c.fotos[id].archivo}`]?.default;
}

export const existeFoto = (c: Contenido, id: IdFoto) => imagenDe(c, id) !== undefined;
