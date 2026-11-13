// robots.txt: permite todo menos la vista interna y apunta al sitemap.
// En la vista previa (PUBLIC_NOINDEX=true) bloquea todo.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const noindex = import.meta.env.PUBLIC_NOINDEX === 'true';
  const sitemap = new URL('sitemap.xml', site ?? 'https://deltafractional.com').href;
  const texto = noindex
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /vista-interna/\n\nSitemap: ${sitemap}\n`;
  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
