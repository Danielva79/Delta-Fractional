// DATOS DE EJEMPLO: solo para /vista-interna/ (noindex, fuera del sitemap).
// No son clientes, cifras ni testimonios reales y NUNCA se usan en las páginas públicas.
// Están escritos para que se note que son de ejemplo.

export const casoEjemplo = {
  titulo: 'Caso de ejemplo: título del caso con el resultado principal',
  antes: 'Ejemplo. Aquí va la situación del cliente antes del trabajo, con una cifra real y su permiso.',
  queHice: 'Ejemplo. Aquí va lo que hizo Daniel, en primera persona y en dos o tres frases.',
  despues: 'Ejemplo. Aquí va el resultado medible, con la cifra antes que el adjetivo.',
};

export const testimoniosEjemplo = [
  { nombre: 'Nombre de ejemplo', cargo: 'Cargo de ejemplo', empresa: 'Empresa de ejemplo', texto: 'Ejemplo de testimonio. Aquí va lo que dijo un cliente real, con su permiso y sin editar el sentido.' },
  { nombre: 'Otro nombre de ejemplo', cargo: 'Cargo de ejemplo', empresa: 'Empresa de ejemplo', texto: 'Segundo testimonio de ejemplo, para ver cómo se acomodan dos en la misma fila.' },
];

const logoSvg = (texto: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="36" viewBox="0 0 140 36"><rect x="1" y="1" width="138" height="34" rx="6" fill="none" stroke="#353C46" stroke-dasharray="4 3"/><text x="70" y="23" font-family="sans-serif" font-size="12" fill="#353C46" text-anchor="middle">${texto}</text></svg>`,
  )}`;
export const logosEjemplo = [
  { nombre: 'Logo de ejemplo 1', archivo: logoSvg('Logo de ejemplo') },
  { nombre: 'Logo de ejemplo 2', archivo: logoSvg('Logo de ejemplo') },
  { nombre: 'Logo de ejemplo 3', archivo: logoSvg('Logo de ejemplo') },
];

export const cursoEjemplo = {
  nombre: 'Nombre del curso (ejemplo)',
  modulos: 'Módulo 1 de ejemplo\nMódulo 2 de ejemplo\nMódulo 3 de ejemplo',
  url: null,
};
