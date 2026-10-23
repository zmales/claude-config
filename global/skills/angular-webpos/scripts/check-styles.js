#!/usr/bin/env node
/**
 * Validaciones deterministas de estilo y plantillas (ver references/estilos.md y ux.md).
 *
 *   SCSS  - color literal en el VALOR de una propiedad (#hex, rgb/rgba/hsl con números) → var(--token) o clase
 *           (los selectores de id como `#fade` no cuentan)
 *         - !important
 *         - outline: none/0 sin :focus-visible en el mismo archivo
 *   HTML  - style="…" estático, [style.x] / [ngStyle] (también dentro de `template:` en .ts)
 *         - color literal en bindings (rgb()/hsl() o '#hex' entre comillas, p. ej. [overlayColor])
 *         - *ngIf / *ngFor / *ngSwitch (usar @if / @for / @switch)
 *   TS    - confirmButtonColor / cancelButtonColor con color literal en SweetAlert (usar tema .wp-swal)
 *
 * Uso (desde la raíz del repo):
 *   node "$HOME/.claude/skills/angular-webpos/scripts/check-styles.js" [rutas...]
 * Sin rutas revisa src/app. Pasa los archivos o carpetas que tocaste para no arrastrar la deuda existente.
 * Los archivos del sistema de diseño (_tokens, _variables, _design-system) se omiten siempre.
 * Sale con código 1 si encuentra problemas.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const targets = process.argv.slice(2);
const inputs = (targets.length ? targets : ['src/app']).map((p) => path.resolve(ROOT, p));

// Archivos del sistema de diseño: allí SÍ se definen los valores literales. Se excluyen por nombre,
// estén donde estén y aunque se pasen explícitamente por ruta.
const ALLOWED = /(^|[\\/])_(tokens|variables|design-system)\.scss$/;

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

const blank = (m) => m.replace(/[^\n]/g, ' ');

/** Reemplaza comentarios por espacios conservando saltos de línea, para no perder la numeración. */
function stripComments(src, lineComments) {
  let out = src.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (lineComments) out = out.replace(/(^|[^:'"])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));
  return out;
}

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const FN_COLOR = /\b(rgba?|hsla?)\(\s*\d/;
const COLOR_MSG = 'color literal; usa var(--token) o una clase del design system (references/estilos.md)';

/**
 * Valores de las declaraciones (`prop: valor`) de una línea SCSS, ignorando selectores, y si la
 * última declaración sigue abierta en la línea siguiente (valor multilínea: `box-shadow:\n 0 0 #fff,`).
 * Es selector si termina en `{` sin `;`, o si termina en `,` sin `;` y sus `:` van pegados (`a:hover,`).
 */
function declarationValues(line) {
  const t = line.trim();
  const none = { values: [], open: false };
  if (!t) return none;
  if (/\{\s*$/.test(t) && !t.includes(';')) return none;
  if (/,\s*$/.test(t) && !t.includes(';') && !/:(\s|$)/.test(t)) return none;
  const body = t.includes('{') ? t.slice(t.lastIndexOf('{') + 1) : t;
  const values = [];
  const re = /(?:^|;)\s*(\$[\w-]+|--[\w-]+|[a-zA-Z-]+)\s*:\s*([^;{}]*)/g;
  let m;
  let lastEnd = -1;
  while ((m = re.exec(body))) { values.push(m[2]); lastEnd = re.lastIndex; }
  const open = values.length > 0 && lastEnd === body.length && !/[;}]\s*$/.test(body);
  return { values, open };
}

const HTML_RULES = [
  { re: /(?<![\[.\w-])style\s*=\s*"/, msg: 'estilo inline; usa clases de Bootstrap o del design system' },
  { re: /\[(style\.[\w.-]+|ngStyle)\]/, msg: 'estilo inline dinámico; usa [class.x]. Solo para valores calculados (p. ej. ancho %), con comentario' },
  { re: /\*ng(If|For|Switch)\b/, msg: 'directiva estructural legada; usa @if / @for / @switch' },
  // Colores pasados por binding (p. ej. [overlayColor]="'rgba(0,0,0,.25)'"). `#ref` de plantilla no cuenta: solo
  // un hex entre comillas simples.
  { re: /\b(rgba?|hsla?)\(\s*\d|'#[0-9a-fA-F]{3,8}'/, msg: 'color literal en la plantilla; usa una clase o el valor por defecto del componente' },
];

const TS_RULES = [
  { re: /(confirm|cancel|deny)ButtonColor\s*:\s*['"`](#|rgb|hsl)/, msg: 'color literal en SweetAlert; usa customClass wp-swal + buttonsStyling:false (references/ux.md)' },
];

const files = [...new Set(inputs.flatMap(collect))].filter(
  (f) => /\.(scss|html|ts)$/.test(f) && !/\.spec\.ts$/.test(f) && !ALLOWED.test(f)
);

const findings = [];
const push = (file, i, msg, rawLines) => findings.push({ file, line: i + 1, msg, text: (rawLines[i] ?? '').trim() });

function checkHtmlLines(file, lines, rawLines, offset = 0) {
  lines.forEach((line, i) => {
    for (const rule of HTML_RULES) if (rule.re.test(line)) push(file, i + offset, rule.msg, rawLines);
  });
}

for (const file of files) {
  const ext = path.extname(file).slice(1);
  const raw = fs.readFileSync(file, 'utf8');
  const rawLines = raw.split('\n');

  if (ext === 'html') {
    checkHtmlLines(file, raw.replace(/<!--[\s\S]*?-->/g, blank).split('\n'), rawLines);
    continue;
  }

  const src = stripComments(raw, true);
  const lines = src.split('\n');

  if (ext === 'scss') {
    let inValue = false; // dentro de un valor que empezó en una línea anterior
    lines.forEach((line, i) => {
      let values;
      if (inValue) {
        values = [line];
        inValue = !/[;{}]/.test(line);
      } else {
        const d = declarationValues(line);
        values = d.values;
        inValue = d.open;
      }
      if (values.some((v) => HEX.test(v) || FN_COLOR.test(v))) push(file, i, COLOR_MSG, rawLines);
      if (/!important/.test(line)) push(file, i, '!important; resuélvelo por especificidad u orden', rawLines);
    });
    if (!/:focus-visible/.test(src)) {
      lines.forEach((line, i) => {
        if (/outline\s*:\s*(none|0)\b/.test(line)) push(file, i, 'outline eliminado sin :focus-visible alternativo', rawLines);
      });
    }
    continue;
  }

  // .ts
  lines.forEach((line, i) => {
    for (const rule of TS_RULES) if (rule.re.test(line)) push(file, i, rule.msg, rawLines);
  });
  // Plantillas inline (`template: \`…\``): se revisan con las reglas de HTML.
  const tplRe = /template\s*:\s*`([\s\S]*?)`/g;
  let m;
  while ((m = tplRe.exec(raw))) {
    const start = raw.slice(0, m.index + m[0].indexOf('`') + 1).split('\n').length - 1;
    checkHtmlLines(file, m[1].replace(/<!--[\s\S]*?-->/g, blank).split('\n'), rawLines, start);
  }
}

if (findings.length === 0) {
  console.log(`check-styles: OK — ${files.length} archivo(s) revisados.`);
  process.exit(0);
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
let current = '';
for (const f of findings) {
  const r = path.relative(ROOT, f.file).replace(/\\/g, '/');
  if (r !== current) { console.log(`\n${r}`); current = r; }
  console.log(`  ${f.line}: ${f.msg}\n      ${f.text.slice(0, 120)}`);
}
const nFiles = new Set(findings.map((f) => f.file)).size;
console.log(`\ncheck-styles: ${findings.length} problema(s) en ${nFiles} archivo(s) de ${files.length} revisados.`);
process.exit(1);
