// sitemap.xml con / y /en/ y sus alternos (hreflang). La vista interna no se incluye.
// /autodiagnostico/ (solo en español, sin alternos) entra con features.autodiagnostico;
// /politica-datos/ solo cuando deja de ser borrador. El blog (/blog/ y sus artículos) existe solo en español.
import type { APIRoute } from 'astro';
import { contenido } from '../lib/contenido';
import { politica, RUTA_AUTODIAGNOSTICO, RUTA_POLITICA } from '../lib/autodiagnostico/contenido';
import { articulos, RUTA_BLOG } from '../lib/blog';

export const GET: APIRoute = ({ site }) => {
  const abs = (p: string) => new URL(p, site ?? 'https://deltafractional.com').href;
  const es = contenido('es');
  const grupos: { es: string; en: string }[] = [{ es: '/', en: '/en/' }];
  const solos: string[] = [];
  if (es.features.autodiagnostico) {
    solos.push(RUTA_AUTODIAGNOSTICO);
    if (!politica.borrador) solos.push(RUTA_POLITICA);
  }
  solos.push(RUTA_BLOG, ...articulos.map((a) => a.ruta));

  const url = (loc: string, g: { es: string; en: string }) => `  <url>
    <loc>${abs(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="es-CO" href="${abs(g.es)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(g.en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(g.es)}"/>
  </url>`;
  const cuerpo = [
    ...grupos.flatMap((g) => [url(g.es, g), url(g.en, g)]),
    ...solos.map((p) => `  <url>\n    <loc>${abs(p)}</loc>\n  </url>`),
  ].join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${cuerpo}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
