#!/usr/bin/env node
/**
 * Verifica la paridad de traducciones ES/EN de un proyecto Angular WebPOS (ngx-translate con archivos .ts).
 *
 * Para cada `*.es.ts` bajo `src/app/_config/lang/` busca su `*.en.ts` hermano, evalúa ambos (transpilados con
 * el `typescript` del proyecto) y compara las claves de cada constante exportada. Reporta:
 *   - archivos sin pareja
 *   - constantes exportadas solo en un idioma
 *   - claves que existen en un idioma y faltan en el otro
 *   - valores vacíos
 *   - archivos de feature que nadie importa (traducciones que no se registraron en es.ts / en.ts)
 *   - un archivo de inglés que importa uno de español (`en.ts` → `x.es`) o viceversa
 *
 * Uso (desde la raíz del repo):
 *   node "$HOME/.claude/skills/angular-webpos/scripts/check-i18n.js" [carpeta-de-idiomas]
 * El argumento opcional es la CARPETA de idiomas (por defecto src/app/_config/lang), no un archivo suelto.
 * Sale con código 1 si encuentra problemas y con 2 si la carpeta no existe o no contiene pares .es/.en.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = process.cwd();
const LANG_DIR = path.resolve(ROOT, process.argv[2] || 'src/app/_config/lang');

let ts;
try {
  ts = require(require.resolve('typescript', { paths: [ROOT] }));
} catch {
  console.error('No se encontró el paquete "typescript". Ejecuta el script desde la raíz del repo con node_modules instalado.');
  process.exit(2);
}

if (!fs.existsSync(LANG_DIR) || !fs.statSync(LANG_DIR).isDirectory()) {
  console.error(
    `No existe la carpeta de traducciones: ${LANG_DIR}\n` +
    'El argumento es la CARPETA de idiomas (p. ej. src/app/_config/lang), no un archivo.'
  );
  process.exit(2);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

const cache = new Map();

/** Evalúa un .ts del árbol de traducciones resolviendo sus imports relativos. */
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const source = fs.readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: file,
  });
  const mod = { exports: {} };
  cache.set(file, mod);
  const localRequire = (spec) => {
    if (!spec.startsWith('.')) return {};
    const base = path.resolve(path.dirname(file), spec);
    const candidates = [base, `${base}.ts`, path.join(base, 'index.ts')];
    const target = candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
    if (!target) throw new Error(`No se pudo resolver "${spec}" desde ${rel(file)}`);
    return load(target);
  };
  vm.runInNewContext(outputText, { module: mod, exports: mod.exports, require: localRequire }, { filename: file });
  return mod.exports;
}

function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.set(key, v);
  }
  return out;
}

const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');

const files = walk(LANG_DIR).filter((f) => /\.(es|en)\.ts$/.test(f) || /[\\/](es|en)\.ts$/.test(f));
const esFiles = files.filter((f) => /(^|[\\/.])es\.ts$/.test(f));
const problems = [];
const add = (file, msg) => problems.push({ file: rel(file), msg });

if (esFiles.length === 0) {
  console.error(
    `check-i18n: 0 pares .es/.en en ${rel(LANG_DIR) || '.'}.\n` +
    'El argumento debe ser la carpeta de idiomas (la que contiene es.ts / en.ts y las subcarpetas de feature), ' +
    'p. ej. src/app/_config/lang. Sin argumento se usa esa ruta.'
  );
  process.exit(2);
}

for (const esFile of esFiles) {
  const enFile = esFile.replace(/es\.ts$/, 'en.ts');
  if (!fs.existsSync(enFile)) {
    add(esFile, `falta el archivo en inglés ${rel(enFile)}`);
    continue;
  }
  let es, en;
  try {
    es = load(esFile);
    en = load(enFile);
  } catch (err) {
    add(esFile, `no se pudo evaluar: ${err.message}`);
    continue;
  }
  const names = new Set([...Object.keys(es), ...Object.keys(en)]);
  for (const name of names) {
    if (!(name in es)) { add(esFile, `la constante "${name}" existe en EN pero no en ES`); continue; }
    if (!(name in en)) { add(enFile, `la constante "${name}" existe en ES pero no en EN`); continue; }
    // En las raíces (es.ts / en.ts) solo importa que se registren las mismas features: el detalle de
    // cada feature ya se compara en su propio par y repetirlo aquí duplicaría cada hallazgo.
    const isRoot = /[\\/]es\.ts$/.test(esFile);
    const fes = isRoot ? new Map(Object.entries(es[name]?.data ?? {})) : flatten(es[name]);
    const fen = isRoot ? new Map(Object.entries(en[name]?.data ?? {})) : flatten(en[name]);
    const scope = isRoot ? `${name}.data` : name;
    for (const k of fes.keys()) if (!fen.has(k)) add(enFile, `falta la clave ${scope}.${k}`);
    for (const k of fen.keys()) if (!fes.has(k)) add(esFile, `falta la clave ${scope}.${k}`);
    if (isRoot) continue;
    // Un vacío en ambos idiomas es intencional (p. ej. columnas de solo icono); en uno solo, es un olvido.
    for (const [k, v] of fes) if (v === '' && fen.has(k) && fen.get(k) !== '') add(esFile, `valor vacío en ${name}.${k} (en EN sí tiene texto)`);
    for (const [k, v] of fen) if (v === '' && fes.has(k) && fes.get(k) !== '') add(enFile, `valor vacío en ${name}.${k} (en ES sí tiene texto)`);
  }
}

for (const enFile of files.filter((f) => /(^|[\\/.])en\.ts$/.test(f))) {
  if (!fs.existsSync(enFile.replace(/en\.ts$/, 'es.ts'))) add(enFile, 'falta el archivo en español');
}

// Imports cruzados: un archivo de un idioma que importa uno del otro (p. ej. en.ts con `./x/x.es`) hace que la
// pantalla salga en el idioma equivocado aunque las claves coincidan.
const langOf = (f) => (/(^|[\\/.])en\.ts$/.test(f) ? 'en' : 'es');
for (const f of files) {
  const lang = langOf(f);
  const other = lang === 'en' ? 'es' : 'en';
  const otherRe = new RegExp(`[./]${other}(\\.ts)?$`);
  const src = fs.readFileSync(f, 'utf8');
  const re = /from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1];
    if (otherRe.test(spec)) {
      const line = src.slice(0, m.index).split('\n').length;
      add(f, `línea ${line}: el archivo ${lang.toUpperCase()} importa "${spec}" (${other.toUpperCase()})`);
    }
  }
}

// Archivos de feature que ningún otro archivo importa: la traducción existe pero no se cargó.
// Solo tiene sentido si se revisa la carpeta raíz (la que contiene es.ts / en.ts).
const hasRoots = fs.existsSync(path.join(LANG_DIR, 'es.ts')) && fs.existsSync(path.join(LANG_DIR, 'en.ts'));
if (!hasRoots) console.log('check-i18n: aviso — la carpeta no tiene es.ts / en.ts; se omite la comprobación de registro.');
const sources = files.map((f) => fs.readFileSync(f, 'utf8'));
for (const f of hasRoots ? files : []) {
  if (/[\\/](es|en)\.ts$/.test(f)) continue; // raíces
  const stem = path.basename(f, '.ts'); // p. ej. item.es
  const imported = sources.some((src) => src.includes(`/${stem}'`) || src.includes(`/${stem}"`));
  if (!imported) add(f, 'ningún archivo lo importa (¿falta registrarlo en es.ts / en.ts?)');
}

if (problems.length === 0) {
  console.log(`check-i18n: OK — ${esFiles.length} pares ES/EN con las mismas claves.`);
  process.exit(0);
}

const byFile = new Map();
for (const p of problems) byFile.set(p.file, [...(byFile.get(p.file) ?? []), p.msg]);
for (const [file, msgs] of byFile) {
  console.log(`\n${file}`);
  for (const m of msgs) console.log(`  - ${m}`);
}
console.log(`\ncheck-i18n: ${problems.length} problema(s) en ${byFile.size} archivo(s).`);
process.exit(1);
