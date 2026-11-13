// Publica la vista previa en https://danielva79.github.io/delta-fractional-preview/
// Uso: npm run vista-previa
//
// 1. Construye el sitio bajo la subcarpeta /delta-fractional-preview/ con noindex en todas las
//    páginas y robots.txt que bloquea todo.
// 2. Quita CNAME (la vista previa NUNCA debe reclamar deltafractional.com) e index-en.html, y
//    agrega .nojekyll (sin él, GitHub Pages ignora la carpeta _astro/ y el sitio sale sin estilos).
// 3. Corre la revisión del contenido sobre esa salida.
// 4. Empuja la carpeta a la rama gh-pages del repo de vista previa con las credenciales de git
//    de esta máquina. No toca el repo principal ni producción.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = process.env.VISTA_PREVIA_REPO || 'https://github.com/Danielva79/delta-fractional-preview.git';
const BASE = '/delta-fractional-preview/';
const SALIDA = path.resolve('.tmp/vista-previa/dist');
const correr = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });

fs.rmSync(path.resolve('.tmp/vista-previa'), { recursive: true, force: true });
const env = { ...process.env, BASE_PATH: BASE, PUBLIC_NOINDEX: 'true', OUT_DIR: SALIDA, ASTRO_TELEMETRY_DISABLED: '1' };
correr('npx astro build', { env });

for (const f of ['CNAME', 'index-en.html']) fs.rmSync(path.join(SALIDA, f), { force: true });
fs.writeFileSync(path.join(SALIDA, '.nojekyll'), '');
if (fs.existsSync(path.join(SALIDA, 'CNAME'))) throw new Error('La vista previa no puede llevar CNAME.');

// Todas las páginas deben llevar noindex.
const sinNoindex = [];
const recorrer = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(p);
    else if (e.name.endsWith('.html') && !/name="robots" content="noindex/.test(fs.readFileSync(p, 'utf8'))) sinNoindex.push(p);
  }
};
recorrer(SALIDA);
if (sinNoindex.length) throw new Error(`Páginas sin noindex en la vista previa:\n${sinNoindex.join('\n')}`);

correr('node scripts/revisar.mjs', { env: { ...process.env, REVISAR_DIST: SALIDA, PUBLIC_NOINDEX: 'true' } });

if (process.env.SIN_PUBLICAR === '1') {
  console.log(`\nPrueba sin publicar: la vista previa quedó en ${SALIDA}`);
  process.exit(0);
}

const commit = execSync('git rev-parse --short HEAD').toString().trim();
const g = (cmd) => correr(cmd, { cwd: SALIDA });
g('git init -q -b gh-pages');
g('git add -A');
g(`git -c user.name="Vista previa" -c user.email="noreply@deltafractional.com" commit -q -m "Vista previa de rediseno-marca (${commit})"`);
g(`git push -q --force ${REPO} gh-pages`);
console.log(`\nVista previa publicada (commit ${commit}): https://danielva79.github.io${BASE}`);
console.log('GitHub Pages tarda 1 a 2 minutos en actualizarla.');
