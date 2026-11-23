// PDF del autodiagnóstico: se arma en el navegador con jsPDF (sin servidor) a partir del mismo
// resultado que muestra la pantalla. autodiagnostico.ts lo carga con import() solo al pulsar el botón,
// así jsPDF no pesa en la carga de la página.
// Colores: se leen de las variables de tokens.css (no hay HEX aquí).
// Texto: Helvetica estándar del PDF (cubre tildes y ñ); los caracteres que no tiene se reemplazan.
import { jsPDF } from 'jspdf';
import { SECCIONES, type Respuestas, type Resultado, type Semaforo } from '../lib/autodiagnostico/cuestionario';

export interface TextosPdf {
  titulo: string;
  fecha: string;
  respuestasTitulo: string;
  contacto: string;
  pagina: string;
  antetitulo: string;
  dimensiones: string;
  puntos: string;
  semaforo: Record<Semaforo, { etiqueta: string; texto: string }>;
  inventarioNoAplica: string;
  banderasTitulo: string;
  banderasIntro: string;
  textosBandera: Record<string, string>;
  rutaTitulo: string;
  rutaNota: string;
  rutaBase: { esencial: string; estandar: string };
  rutaModuloA: string;
  rutaModuloB: string;
  notaVentas: string;
  aviso: string;
}

export interface DatosPdf {
  empresa: string;
  respuestas: Respuestas;
  resultado: Resultado;
  anio: number;
  /** URL del logo en PNG (si no carga, el PDF sale sin logo). */
  logo: string;
  textos: TextosPdf;
}

type RGB = [number, number, number];

/** Color de una variable de tokens.css (#RRGGBB) como [r, g, b]. */
function color(variable: string, respaldo: RGB): RGB {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(v);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : respaldo;
}

/** Caracteres que la fuente estándar del PDF no tiene. */
const limpiar = (s: string) =>
  s.replace(/→/g, '->').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

const conAnio = (s: string, anio: number) => s.replaceAll('{ANIO_ANTERIOR}', String(anio - 1)).replaceAll('{ANIO}', String(anio));

async function cargarImagen(url: string): Promise<{ datos: string; ancho: number; alto: number } | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    const datos = await new Promise<string>((ok, mal) => {
      const lector = new FileReader();
      lector.onload = () => ok(String(lector.result));
      lector.onerror = () => mal(lector.error);
      lector.readAsDataURL(blob);
    });
    const img = new Image();
    img.src = datos;
    await img.decode();
    // Se reduce a 800 px de ancho: a 46 mm basta y el PDF pesa mucho menos.
    const escala = Math.min(1, 800 / img.naturalWidth);
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(img.naturalWidth * escala);
    lienzo.height = Math.round(img.naturalHeight * escala);
    lienzo.getContext('2d')!.drawImage(img, 0, 0, lienzo.width, lienzo.height);
    return { datos: lienzo.toDataURL('image/png'), ancho: lienzo.width, alto: lienzo.height };
  } catch {
    return null;
  }
}

/** Nombre del archivo: autodiagnostico-<empresa>-<AAAA-MM-DD>.pdf */
export function nombreArchivo(empresa: string, hoy = new Date()): string {
  const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(hoy);
  const slug = empresa
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40).replace(/-+$/g, '');
  return `autodiagnostico-${slug || 'empresa'}-${fecha}.pdf`;
}

export async function generarPdf(d: DatosPdf): Promise<jsPDF> {
  const { resultado: r, textos: t } = d;
  const tinta = color('--ink', [53, 60, 70]);
  const tinta2 = color('--ink-2', [91, 100, 112]);
  const acento = color('--accent', [238, 125, 34]);
  const superficie = color('--surface', [244, 245, 247]);
  const superficie2 = color('--surface-2', [236, 237, 238]);
  const linea = color('--line', [227, 229, 232]);
  const sem: Record<Semaforo, RGB> = {
    rojo: color('--neg', [192, 57, 43]),
    amarillo: color('--orange-600', [195, 98, 10]),
    verde: color('--pos', [46, 125, 79]),
  };

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const ANCHO = doc.internal.pageSize.getWidth();
  const ALTO = doc.internal.pageSize.getHeight();
  const M = 18; // margen
  const UTIL = ANCHO - 2 * M;
  const PIE = 16; // espacio reservado para el pie
  let y = M;

  const fuente = (tamano: number, estilo: 'normal' | 'bold' = 'normal', c: RGB = tinta) => {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tamano);
    doc.setTextColor(...c);
  };
  const alto = (tamano: number) => tamano * 0.3528 * 1.35; // alto de línea en mm
  const lineas = (texto: string, ancho: number) => doc.splitTextToSize(limpiar(texto), ancho) as string[];
  /** Salta de página si no caben `mm` más. */
  const asegurar = (mm: number) => {
    if (y + mm > ALTO - PIE) {
      doc.addPage();
      y = M;
    }
  };
  /** Párrafo con salto de página por línea. Devuelve el alto usado. */
  const parrafo = (texto: string, tamano: number, opciones: { x?: number; ancho?: number; estilo?: 'normal' | 'bold'; c?: RGB } = {}) => {
    const x = opciones.x ?? M;
    fuente(tamano, opciones.estilo, opciones.c);
    const h = alto(tamano);
    for (const l of lineas(texto, opciones.ancho ?? UTIL - (x - M))) {
      asegurar(h);
      doc.text(l, x, y + h * 0.75);
      y += h;
    }
  };
  const titulo = (texto: string) => {
    asegurar(14);
    y += 4;
    parrafo(texto, 13, { estilo: 'bold' });
    y += 2;
  };
  const vineta = (texto: string, tamano = 10.5) => {
    fuente(tamano);
    const h = alto(tamano);
    const ls = lineas(texto, UTIL - 6);
    asegurar(h * Math.min(ls.length, 2));
    doc.setFillColor(...tinta);
    doc.circle(M + 1.6, y + h * 0.5, 0.7, 'F');
    for (const l of ls) {
      asegurar(h);
      doc.text(l, M + 6, y + h * 0.75);
      y += h;
    }
    y += 1;
  };
  const puntosTexto = (p: number, max: number) => t.puntos.replace('{puntos}', String(p)).replace('{maximo}', String(max));

  // ---------- Encabezado ----------
  const logo = await cargarImagen(d.logo);
  if (logo) {
    const w = 46;
    doc.addImage(logo.datos, 'PNG', M, y, w, (w * logo.alto) / logo.ancho, 'logo', 'FAST');
  }
  const fechaTexto = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  fuente(9, 'bold', tinta);
  doc.text(limpiar(t.titulo), ANCHO - M, y + 4, { align: 'right' });
  fuente(9, 'normal', tinta2);
  doc.text(limpiar(t.fecha.replace('{fecha}', fechaTexto)), ANCHO - M, y + 9, { align: 'right' });
  y += 16;
  doc.setDrawColor(...acento);
  doc.setLineWidth(0.8);
  doc.line(M, y, ANCHO - M, y);
  y += 9;

  // ---------- Empresa ----------
  parrafo(t.antetitulo, 9.5, { c: tinta2 });
  y += 1;
  parrafo(d.empresa, 20, { estilo: 'bold' });
  y += 5;

  // ---------- Total ----------
  const nivel = t.semaforo[r.semaforo];
  fuente(10.5);
  const textoNivel = lineas(nivel.texto, UTIL - 62);
  const altoCaja = Math.max(34, 16 + textoNivel.length * alto(10.5));
  asegurar(altoCaja);
  doc.setFillColor(...superficie);
  doc.roundedRect(M, y, UTIL, altoCaja, 3, 3, 'F');
  doc.setFillColor(...acento);
  doc.rect(M + 7, y + 8, 1.2, altoCaja - 16, 'F');
  fuente(30, 'bold');
  doc.text(`${r.porcentaje} %`, M + 12, y + altoCaja / 2 + 2);
  fuente(9, 'normal', tinta2);
  doc.text(limpiar(puntosTexto(r.puntos, r.maximo)), M + 12, y + altoCaja / 2 + 8);
  const xTexto = M + 58;
  let yTexto = y + 10;
  doc.setFillColor(...sem[r.semaforo]);
  doc.circle(xTexto + 2, yTexto - 1.3, 2, 'F');
  fuente(11, 'bold');
  doc.text(limpiar(nivel.etiqueta), xTexto + 6, yTexto);
  yTexto += 6;
  fuente(10.5);
  for (const l of textoNivel) {
    doc.text(l, xTexto, yTexto);
    yTexto += alto(10.5);
  }
  y += altoCaja + 4;

  // ---------- Dimensiones ----------
  titulo(t.dimensiones);
  for (const dim of r.dimensiones) {
    const nota = dim.id === 'costos' && r.inventarioNoAplica;
    asegurar(nota ? 17 : 12);
    fuente(10.5, 'bold');
    doc.text(limpiar(dim.titulo), M, y + 4);
    fuente(9.5, 'normal', tinta2);
    doc.text(limpiar(`${puntosTexto(dim.puntos, dim.maximo)} · ${t.semaforo[dim.semaforo].etiqueta}`), ANCHO - M, y + 4, { align: 'right' });
    y += 6.5;
    doc.setFillColor(...superficie2);
    doc.roundedRect(M, y, UTIL, 3, 1.5, 1.5, 'F');
    if (dim.porcentaje > 0) {
      doc.setFillColor(...sem[dim.semaforo]);
      doc.roundedRect(M, y, Math.max(3, (UTIL * dim.porcentaje) / 100), 3, 1.5, 1.5, 'F');
    }
    y += 5.5;
    if (nota) {
      parrafo(t.inventarioNoAplica, 9, { c: tinta2 });
      y += 1;
    }
  }

  // ---------- Alertas ----------
  if (r.banderas.length) {
    titulo(t.banderasTitulo);
    parrafo(t.banderasIntro, 10.5);
    y += 1.5;
    for (const id of r.banderas) vineta(t.textosBandera[id] ?? id);
  }

  // ---------- Ruta probable ----------
  titulo(t.rutaTitulo);
  vineta(t.rutaBase[r.ruta.base]);
  if (r.ruta.moduloA) vineta(t.rutaModuloA);
  if (r.ruta.moduloB) vineta(t.rutaModuloB);
  parrafo(t.rutaNota, 9, { c: tinta2 });
  y += 4;

  if (r.notaVentas) {
    parrafo(conAnio(t.notaVentas, d.anio), 10.5);
    y += 3;
  }
  parrafo(t.aviso, 9, { c: tinta2 });
  y += 3;
  parrafo(t.contacto, 10.5, { estilo: 'bold' });

  // ---------- Respuestas ----------
  doc.addPage();
  y = M;
  parrafo(t.respuestasTitulo, 16, { estilo: 'bold' });
  y += 2;
  for (const s of SECCIONES) {
    asegurar(20);
    y += 3;
    parrafo(s.titulo, 12, { estilo: 'bold', c: tinta });
    doc.setDrawColor(...linea);
    doc.setLineWidth(0.3);
    doc.line(M, y + 1, ANCHO - M, y + 1);
    y += 4;
    for (const q of s.preguntas) {
      const opcion = q.opciones[d.respuestas[q.id]];
      asegurar(12);
      parrafo(conAnio(q.texto, d.anio), 10, { estilo: 'bold' });
      parrafo(opcion ? opcion.texto : '-', 10, { x: M + 4, c: tinta2 });
      y += 2.5;
    }
  }

  // ---------- Pie en cada página ----------
  const total = doc.getNumberOfPages();
  for (let n = 1; n <= total; n++) {
    doc.setPage(n);
    doc.setDrawColor(...linea);
    doc.setLineWidth(0.3);
    doc.line(M, ALTO - 12, ANCHO - M, ALTO - 12);
    fuente(8, 'normal', tinta2);
    doc.text('deltafractional.com', M, ALTO - 8);
    doc.text(limpiar(t.pagina.replace('{n}', String(n)).replace('{total}', String(total))), ANCHO - M, ALTO - 8, { align: 'right' });
  }

  doc.setProperties({ title: limpiar(`${t.titulo} - ${d.empresa}`), author: 'Delta Fractional', creator: 'deltafractional.com' });
  return doc;
}

/** Genera el PDF y lo descarga. */
export async function descargarPdf(d: DatosPdf): Promise<void> {
  const doc = await generarPdf(d);
  doc.save(nombreArchivo(d.empresa));
}
