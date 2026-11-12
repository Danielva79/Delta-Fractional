// Revisa el sitio construido (dist/) contra las reglas de contenido y marca.
// Uso: npm run build && npm run revisar
// Sale con código 1 si encuentra algún problema.
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.env.REVISAR_DIST || 'dist';
const es = JSON.parse(fs.readFileSync('src/content/es.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/content/en.json', 'utf8'));
const paginas = { '/': es, '/en/': en };
const PROHIBIDAS = [
  'expertise', 'engagement', 'insights', 'sinergia', 'soluciones integrales', 'alto impacto', 'clase mundial',
  'potenciar', 'potencie', 'impulsar', 'impulse', 'accionable', 'inteligencia financiera', 'transformación',
  'ecosistema', 'cerrar la brecha', 'siguiente nivel', 'nosotros', 'hemos ', 'nuestro equipo', 'próximamente',
  'logo cliente', 'foto aquí', 'lorem',
  // El diagnóstico no es gratis (Daniel, 2026-11-12): cuesta desde $2 M.
  'gratis', 'gratuito', 'gratuita',
];
// Equivalentes en inglés: muletillas de consultora y plural ("we", "our team") para una sola persona.
const PROHIBIDAS_EN = [
  'expertise', 'engagement', 'insights', 'synergy', 'synergies', 'world-class', 'world class', 'cutting-edge',
  'empower', 'leverage', 'unlock', 'actionable', 'next level', 'game-changer', 'holistic', 'ecosystem',
  'transformation', 'end-to-end solutions', 'high-impact', 'best-in-class', 'coming soon', 'lorem',
  'free diagnostic', 'free of charge', 'for free',
];
const PLURAL_EN = /\b(we|we're|we've|our|ours|us)\b/i;
const esTodo = (v) => typeof v === 'string' && /^\s*TODO/i.test(v);

const decodificar = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const textoVisible = (html) =>
  decodificar(
    html.replace(/<head[\s\S]*?<\/head>/i, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<span class="sr-only"[^>]*>[\s\S]*?<\/span>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' '),
  );

/** Textos aprobados que deben aparecer tal cual en la página. */
function aprobados(c) {
  const t = [
    c.ctaPrincipal, c.ctaWhatsApp, c.marca.ubicacion,
    c.hero.antetitulo, c.hero.h1, c.hero.subtitulo,
    ...c.prueba.items.map((i) => i.texto), ...c.prueba.items.filter((i) => i.cifra).map((i) => i.cifra),
    c.problema.h2, c.problema.intro, c.problema.cierre, ...c.problema.dolores.flatMap((d) => [d.titulo, d.texto]),
    c.servicios.h2, c.servicios.inversion.precio, c.servicios.inversion.nota,
    ...c.servicios.items.flatMap((s) => [s.nivel, s.titulo, s.texto, s.resultado, s.precio]),
    c.diferencial.h2, ...c.diferencial.pilares.flatMap((p) => [p.titulo, p.texto]),
    c.deltaBI.h2, c.deltaBI.texto, c.deltaBI.nota,
    c.sobre.h2, ...c.sobre.parrafos, c.sobre.linkedinLabel,
    c.diagnostico.antetitulo, c.diagnostico.h2, c.diagnostico.texto, c.diagnostico.cta,
    c.faq.h2, ...c.faq.items.flatMap((f) => [f.p, f.r]),
    c.cierre.h2, c.cierre.texto, c.footer.linea,
  ];
  return t.filter((v) => typeof v === 'string' && !esTodo(v));
}

const problemas = [];
const avisar = (pagina, msg) => problemas.push(`${pagina}: ${msg}`);

for (const [ruta, c] of Object.entries(paginas)) {
  const archivo = path.join(DIST, ruta, 'index.html');
  if (!fs.existsSync(archivo)) { avisar(ruta, 'no existe en dist/ (¿corrió npm run build?)'); continue; }
  const html = fs.readFileSync(archivo, 'utf8');
  const texto = textoVisible(html);
  const minus = texto.toLowerCase();

  if (/TODO/.test(texto) || /TODO/.test(html.replace(/<script[\s\S]*?<\/script>/gi, ''))) avisar(ruta, 'aparece "TODO"');
  if (/—/.test(texto)) avisar(ruta, 'hay rayas largas (—)');
  // © ® ™ son pictográficos para Unicode, pero no emojis.
  if (/\p{Extended_Pictographic}/u.test(texto.replace(/[©®™]/g, ''))) avisar(ruta, 'hay emojis');
  if (/\bDELTA\b/.test(texto)) avisar(ruta, '"DELTA" en mayúsculas en el texto');
  if (/fractional cfo|cfo fraccional/i.test(texto)) avisar(ruta, '"CFO" usado como nombre en el texto visible');
  for (const p of PROHIBIDAS) if (minus.includes(p)) avisar(ruta, `palabra prohibida: "${p.trim()}"`);
  if (c.idioma === 'en' || ruta.startsWith('/en/')) {
    for (const p of PROHIBIDAS_EN) if (minus.includes(p)) avisar(ruta, `palabra prohibida (EN): "${p}"`);
    const plural = texto.match(PLURAL_EN);
    if (plural) avisar(ruta, `primera persona del plural en inglés: "${plural[0]}" (es una sola persona: I, my)`);
  }
  if (ruta === '/' && /\+\s*IVA|IVA incluido/i.test(texto) && esTodo(es.servicios.inversion.iva)) avisar(ruta, 'menciona IVA sin confirmar');

  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) avisar(ruta, `tiene ${h1} H1 (debe ser 1)`);
  let anterior = 1;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
    const n = +m[1];
    if (n > anterior + 1) avisar(ruta, `salto de encabezado: h${anterior} → h${n}`);
    anterior = n;
  }
  for (const t of aprobados(c)) {
    if (!texto.includes(t)) avisar(ruta, `no aparece el texto aprobado: "${t.slice(0, 70)}${t.length > 70 ? '…' : ''}"`);
  }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(m[0])) avisar(ruta, `imagen sin alt: ${m[0].slice(0, 90)}`);
  }
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(m[0])) avisar(ruta, `enlace externo sin rel="noopener": ${m[0].slice(0, 90)}`);
  }
}

// Aviso de privacidad y formulario: no se publican incompletos.
const privEs = JSON.parse(fs.readFileSync('src/content/privacidad.es.json', 'utf8'));
const avisoCompleto = ![es.contacto.nit, es.contacto.direccionFiscal, es.contacto.correo, privEs.vigencia].some(esTodo);
for (const r of ['privacidad', 'en/privacy']) {
  const existe = fs.existsSync(path.join(DIST, r, 'index.html'));
  if (existe && !avisoCompleto) problemas.push(`/${r}/: se publicó el aviso de privacidad con datos pendientes`);
  if (existe) {
    const t = fs.readFileSync(path.join(DIST, r, 'index.html'), 'utf8');
    if (/\[PENDIENTE|TODO/.test(t)) problemas.push(`/${r}/: el aviso tiene datos pendientes visibles`);
  }
}
for (const r of ['/', '/en/']) {
  const t = fs.readFileSync(path.join(DIST, r, 'index.html'), 'utf8');
  const hayForm = t.includes('data-formulario');
  if (hayForm && (!es.features.formularioContacto || !avisoCompleto)) problemas.push(`${r}: el formulario aparece sin bandera o sin aviso de privacidad completo`);
  if (!avisoCompleto && /href="[^"]*(privacidad|privacy)\//.test(t)) problemas.push(`${r}: enlaza un aviso de privacidad que no existe`);
}

// SEO técnico: canonical, hreflang, OG, JSON-LD, sitemap, robots y redirección de index-en.html.
for (const [r, c] of Object.entries(paginas)) {
  const t = fs.readFileSync(path.join(DIST, r, 'index.html'), 'utf8');
  const abs = `https://deltafractional.com${r}`;
  if (!t.includes(`<link rel="canonical" href="${abs}">`)) problemas.push(`${r}: canonical distinto de ${abs}`);
  for (const h of ['es-CO', 'en', 'x-default']) if (!t.includes(`hreflang="${h}"`)) problemas.push(`${r}: falta hreflang ${h}`);
  if (!t.includes(`<title>${c.meta.title}</title>`)) problemas.push(`${r}: el title no es el aprobado`);
  if (!t.includes(`name="description" content="${c.meta.description}"`)) problemas.push(`${r}: la description no es la aprobada`);
  for (const m of ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale', 'twitter:card']) if (!t.includes(m)) problemas.push(`${r}: falta ${m}`);
  if (/name="robots"/.test(t) && process.env.PUBLIC_NOINDEX !== 'true') problemas.push(`${r}: tiene noindex en producción`);
  const ld = t.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  try {
    const g = JSON.parse(ld[1])['@graph'];
    const tipos = g.map((x) => x['@type']).sort().join(',');
    if (tipos !== 'FAQPage,Person,ProfessionalService') problemas.push(`${r}: JSON-LD con tipos ${tipos}`);
    const faq = g.find((x) => x['@type'] === 'FAQPage');
    if (faq.mainEntity.length !== c.faq.items.length) problemas.push(`${r}: FAQPage no tiene las ${c.faq.items.length} preguntas`);
    if (JSON.stringify(g).match(/aggregateRating|"review"|streetAddress/)) problemas.push(`${r}: JSON-LD con datos no permitidos`);
  } catch { problemas.push(`${r}: JSON-LD ausente o inválido`); }
}
const sitemap = fs.existsSync(path.join(DIST, 'sitemap.xml')) ? fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8') : '';
if (!sitemap.includes('<loc>https://deltafractional.com/</loc>') || !sitemap.includes('<loc>https://deltafractional.com/en/</loc>')) problemas.push('sitemap.xml: falta / o /en/');
if (sitemap.includes('vista-interna')) problemas.push('sitemap.xml: incluye la vista interna');
const robots = fs.existsSync(path.join(DIST, 'robots.txt')) ? fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8') : '';
if (process.env.PUBLIC_NOINDEX !== 'true' && (!robots.includes('Disallow: /vista-interna/') || !robots.includes('Sitemap: https://deltafractional.com/sitemap.xml'))) problemas.push('robots.txt: incompleto');
const viejo = path.join(DIST, 'index-en.html');
// (la vista previa lo quita a propósito: su redirección apunta a la raíz del dominio)
if (process.env.PUBLIC_NOINDEX !== 'true' && (!fs.existsSync(viejo) || !/url=\/en\//.test(fs.readFileSync(viejo, 'utf8')))) problemas.push('index-en.html: falta la redirección a /en/');

// La vista interna no se indexa.
const interna = path.join(DIST, 'vista-interna', 'index.html');
if (fs.existsSync(interna) && !/<meta name="robots" content="noindex/.test(fs.readFileSync(interna, 'utf8'))) {
  problemas.push('/vista-interna/: le falta noindex');
}

if (problemas.length) {
  console.error(`\n${problemas.length} problema(s):\n  · ${problemas.join('\n  · ')}\n`);
  process.exitCode = 1;
} else {
  console.log('Revisión OK: textos aprobados presentes, sin TODO, sin rayas largas, sin palabras prohibidas, un H1 y encabezados en orden.');
}
