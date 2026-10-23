#!/usr/bin/env node
/**
 * Validaciones deterministas de estilo y plantillas para el portal (ver references/estilos.md y ux.md).
 *
 *   SCSS  - color literal (#hex, rgb/rgba/hsl con números)   → usar var(--token) o una clase del design system
 *         - !important
 *         - outline: none/0 sin :focus-visible en el mismo archivo
 *   HTML  - atributo style="…" estático
 *         - *ngIf / *ngFor / *ngSwitch (usar @if / @for / @switch)
 *   TS    - confirmButtonColor / cancelButtonColor con color literal en SweetAlert (usar tema .wp-swal)
 *
 * Uso (desde la raíz del repo):
 *   node "$HOME/.claude/skills/wp-frontend/scripts/check-styles.js" [rutas...]
 * Sin rutas revisa src/app. Pasa los archivos o carpetas que tocaste para no arrastrar la deuda existente.
 * Sale con código 1 si encuentra problemas.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const targets = process.argv.slice(2);
const inputs = (targets.length ? targets : ['src/app']).map((p) => path.resolve(ROOT, p));

// Archivos del sistema de diseño: allí SÍ se definen los valores literales.
const ALLOWED = [/[\\/]src[\\/]styles[\\/]_tokens\.scss$/, /[\\/]src[\\/]styles[\\/]_variables\.scss$/];

function collect(p) {
  if (!fs.existsSync(p)) {
    console.error(`No existe: ${path.relative(ROOT, p)}`);
    return [];
  }
  if (fs.statSync(p).isFile()) return [p];
  return fs.readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    e.name === 'node_modules' || e.name.startsWith('.') ? [] : collect(path.join(p, e.name))
  );
}

/** Reemplaza comentarios por espacios conservando saltos de línea, para no perder la numeración. */
function stripComments(src, lineComments) {
  let out = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  if (lineComments) out = out.replace(/(^|[^:'"])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));
  return out;
}

const RULES = {
  scss: [
    { re: /#[0-9a-fA-F]{3,8}\b/g, msg: 'color literal; usa var(--token) (references/estilos.md)' },
    { re: /\b(rgba?|hsla?)\(\s*\d/g, msg: 'color literal; usa var(--token) o rgba(var(--x-rgb), a)' },
    { re: /!important/g, msg: '!important; resuélvelo por especificidad u orden' },
  ],
  html: [
    { re: /(?<![\[.\w-])style\s*=\s*"/g, msg: 'estilo inline; usa clases de Bootstrap o del design system' },
    { re: /\*ng(If|For|Switch)\b/g, msg: 'directiva estructural legada; usa @if / @for / @switch' },
  ],
  ts: [
    { re: /(confirm|cancel)ButtonColor\s*:\s*['"]#/g, msg: 'color literal en SweetAlert; usa customClass wp-swal + buttonsStyling:false (references/ux.md)' },
  ],
};

const files = [...new Set(inputs.flatMap(collect))].filter(
  (f) => /\.(scss|html|ts)$/.test(f) && !/\.spec\.ts$/.test(f) && !ALLOWED.some((re) => re.test(f))
);

const findings = [];
for (const file of files) {
  const ext = path.extname(file).slice(1);
  const raw = fs.readFileSync(file, 'utf8');
  const src = ext === 'html' ? raw.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' ')) : stripComments(raw, true);
  const lines = src.split('\n');

  for (const rule of RULES[ext]) {
    lines.forEach((line, i) => {
      rule.re.lastIndex = 0;
      if (rule.re.test(line)) findings.push({ file, line: i + 1, msg: rule.msg, text: raw.split('\n')[i].trim() });
    });
  }

  if (ext === 'scss' && !/:focus-visible/.test(src)) {
    lines.forEach((line, i) => {
      if (/outline\s*:\s*(none|0)\b/.test(line))
        findings.push({ file, line: i + 1, msg: 'outline eliminado sin :focus-visible alternativo', text: line.trim() });
    });
  }
}

if (findings.length === 0) {
  console.log(`check-styles: OK — ${files.length} archivo(s) revisados.`);
  process.exit(0);
}

let current = '';
for (const f of findings) {
  const r = path.relative(ROOT, f.file).replace(/\\/g, '/');
  if (r !== current) { console.log(`\n${r}`); current = r; }
  console.log(`  ${f.line}: ${f.msg}\n      ${f.text.slice(0, 120)}`);
}
const nFiles = new Set(findings.map((f) => f.file)).size;
console.log(`\ncheck-styles: ${findings.length} problema(s) en ${nFiles} archivo(s) de ${files.length} revisados.`);
process.exit(1);
