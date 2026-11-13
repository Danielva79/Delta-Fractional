// sitemap.xml con / y /en/ y sus alternos (hreflang). La vista interna no se incluye.
// El aviso de privacidad entra solo cuando existe (ver src/lib/privacidad.ts).
import type { APIRoute } from 'astro';
import { contenido } from '../lib/contenido';
import { privacidadLista } from '../lib/privacidad';

export const GET: APIRoute = ({ site }) => {
  const abs = (p: string) => new URL(p, site ?? 'https://deltafractional.com').href;
  const grupos: { es: string; en: string }[] = [{ es: '/', en: '/en/' }];
  if (privacidadLista(contenido('es'))) grupos.push({ es: '/privacidad/', en: '/en/privacy/' });

  const url = (loc: string, g: { es: string; en: string }) => `  <url>
    <loc>${abs(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="es-CO" href="${abs(g.es)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(g.en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(g.es)}"/>
  </url>`;
  const cuerpo = grupos.flatMap((g) => [url(g.es, g), url(g.en, g)]).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${cuerpo}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
