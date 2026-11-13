// Fotos reales: se buscan en la carpeta /fotos (raíz del repo) durante el build.
import type { ImageMetadata } from 'astro';
import type { Contenido } from './contenido';
import type { IdFoto } from '../content/schema';

const archivos = import.meta.glob<{ default: ImageMetadata }>('/fotos/*.{jpg,jpeg,png,webp}', { eager: true });

const buscar = (archivo: string | undefined) => (archivo ? archivos[`/fotos/${archivo}`]?.default : undefined);

/** Imagen del slot si su archivo existe; si no, undefined. */
export function imagenDe(c: Contenido, id: IdFoto): ImageMetadata | undefined {
  return buscar(c.fotos[id].archivo);
}

/** Recorte para móvil del slot (fotos[id].archivoMovil), si existe. */
export function imagenMovilDe(c: Contenido, id: IdFoto): ImageMetadata | undefined {
  return buscar(c.fotos[id].archivoMovil);
}

export const existeFoto = (c: Contenido, id: IdFoto) => imagenDe(c, id) !== undefined;

/**
 * Anchos del srcset: 480, 800, 1200 y 1600, sin pasar del original (nunca se amplía),
 * más el ancho original cuando es menor que 1600. Ej.: retrato de 860 px → 480, 800, 860.
 */
export function anchosDe(img: ImageMetadata): number[] {
  const anchos = [480, 800, 1200, 1600].filter((w) => w <= img.width);
  if (img.width < 1600 && !anchos.includes(img.width)) anchos.push(img.width);
  return anchos;
}
