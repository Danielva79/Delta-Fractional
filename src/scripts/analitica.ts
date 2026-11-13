// Analítica y comportamiento de enlaces (se carga en todas las páginas, < 2 KB).
// - track(evento, props): envía a Umami si está cargado. Con ?analitica=debug en la URL
//   (o en desarrollo) también escribe cada evento en la consola, para verificarlos.
// - Clic en cualquier elemento con data-evento → track(evento, { ubicacion, idioma }).
// - Abrir una pregunta frecuente → faq_open con la pregunta.
// - Enlaces de WhatsApp: misma pestaña en móvil, pestaña nueva en escritorio.

type Props = Record<string, string | number | boolean>;
declare global {
  interface Window {
    umami?: { track: (evento: string, datos?: Props) => void };
    track: (evento: string, props?: Props) => void;
    __eventos?: { evento: string; props: Props }[];
  }
}

const idioma = document.documentElement.lang.startsWith('en') ? 'en' : 'es';
const depurar = import.meta.env.DEV || new URLSearchParams(location.search).get('analitica') === 'debug';

export function track(evento: string, props: Props = {}) {
  const datos = { idioma, ...props };
  (window.__eventos ??= []).push({ evento, props: datos });
  if (depurar) console.info('[analítica]', evento, datos);
  try {
    window.umami?.track(evento, datos);
  } catch {
    /* la analítica nunca debe romper la página */
  }
}
window.track = track;

// Clics en CTA, WhatsApp, LinkedIn y selector de idioma.
document.addEventListener('click', (e) => {
  const el = (e.target as Element | null)?.closest<HTMLElement>('[data-evento]');
  if (!el) return;
  const props: Props = {};
  if (el.dataset.ubicacion) props.ubicacion = el.dataset.ubicacion;
  track(el.dataset.evento!, props);
});

// Preguntas frecuentes: solo al abrir.
document.querySelectorAll<HTMLDetailsElement>('details[data-faq]').forEach((d) => {
  d.addEventListener('toggle', () => {
    if (d.open) track('faq_open', { ubicacion: 'faq', pregunta: d.dataset.faq ?? '' });
  });
});

// WhatsApp: en escritorio abre en otra pestaña (y lo anuncia); en móvil, en la misma (abre la app).
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const aviso = idioma === 'en' ? ', opens in a new tab' : ', abre en otra pestaña';
  document.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"]').forEach((a) => {
    a.target = '_blank';
    a.rel = 'noopener';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = aviso;
    a.append(sr);
  });
}
