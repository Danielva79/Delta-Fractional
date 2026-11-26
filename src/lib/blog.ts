// Artículos del blog (solo en español): src/content/blog/*.md + textos de src/content/blog.json.
// Se valida en el build: un artículo con un campo vacío o en "TODO" detiene la publicación.
import { z } from 'astro/zod';
import textosJson from '../content/blog.json';
import { texto, bloque } from '../content/schema';

export const RUTA_BLOG = '/blog/';

const esquemaTextos = bloque({
  _nota: z.string().optional(),
  meta: bloque({ title: texto, description: texto }),
  h1: texto,
  intro: texto,
  leer: texto,
  lectura: texto,
  volver: texto,
  autor: texto,
  cierre: bloque({ h2: texto, texto }),
});

const esquemaArticulo = z
  .object({
    titulo: texto,
    tituloSeo: texto,
    descripcion: texto,
    resumen: texto,
    fecha: texto.refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), { message: 'la fecha va como AAAA-MM-DD' }),
    lectura: z.number().int().positive(),
  })
  .strict();

const r = esquemaTextos.safeParse(textosJson);
if (!r.success) throw new Error(`src/content/blog.json: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
export const textosBlog = r.data;

type Modulo = { frontmatter: unknown; Content: any };
const modulos = import.meta.glob<Modulo>('../content/blog/*.md', { eager: true });

export interface Articulo extends z.infer<typeof esquemaArticulo> {
  slug: string;
  ruta: string;
  Content: any;
}

export const articulos: Articulo[] = Object.entries(modulos)
  .map(([archivo, m]) => {
    const slug = archivo.split('/').pop()!.replace(/\.md$/, '');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`${archivo}: el nombre del archivo debe ir en minúsculas, sin tildes, con guiones`);
    const v = esquemaArticulo.safeParse(m.frontmatter);
    if (!v.success) throw new Error(`${archivo}: ${v.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    return { ...v.data, slug, ruta: `${RUTA_BLOG}${slug}/`, Content: m.Content };
  })
  .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.titulo.localeCompare(b.titulo, 'es'));

/** "26 de noviembre de 2026" (la fecha se toma como día calendario, sin zona horaria). */
export const fechaLarga = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
