#!/usr/bin/env node
/**
 * Validaciones deterministas para la API WPApiPortalFeEc (ver references/).
 *
 *   ERROR  - controller del portal sin [Authorize] ni [AllowAnonymous] a nivel de clase
 *          - throw new Exception(...)
 *          - catch vacío
 *          - .Result / .Wait() / .GetAwaiter().GetResult() / async void
 *          - FromSqlRaw / ExecuteSqlRaw con interpolación o concatenación
 *          - servicio concreto de Services.Data sin registrar en ningún *Registration.cs / Program.cs
 *          - Update*Dto que expone CompanyLicCod
 *   AVISO  - entidad (IHasKeyId) sin DbSet en ningún DbContext
 *          - bloqueo síncrono en código de arranque (*Registration.cs / Program.cs)
 *          - acción del portal (01, Controllers/v1) sin [RequirePermission] ni [AllowAnonymous]
 *          - acción del portal sin atributo de rol ([ClaimAccess]/[DbRoleAccess]/[GlobalAdminOnly])
 *          - acción async del portal sin CancellationToken
 *
 * Uso (desde la raíz del repo de la API, o cualquier subcarpeta):
 *   node "$HOME/.claude/skills/wp-backend/scripts/check-backend.js" [rutas...]
 * Sin rutas revisa toda la solución. Con rutas, solo reporta hallazgos en esos archivos/carpetas
 * (los chequeos de registro/DbSet igual leen toda la solución para decidir).
 * Sale con código 1 si hay ERRORES (los AVISOS no cambian el código de salida).
 */
const fs = require('fs');
const path = require('path');

function findRoot(dir) {
  let d = dir;
  while (true) {
    if (fs.existsSync(path.join(d, 'WPApiPortalFeEc.sln'))) return d;
    const parent = path.dirname(d);
    if (parent === d) return null;
    d = parent;
  }
}

const ROOT = findRoot(process.cwd());
if (!ROOT) {
  console.error('No se encontró WPApiPortalFeEc.sln. Ejecuta el script dentro del repo de la API.');
  process.exit(2);
}

const SKIP_DIRS = new Set(['bin', 'obj', 'Migrations', 'node_modules', 'TestResults', '.git', '.claude', '.vs', 'zz-SriTestHarness']);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  if (fs.statSync(dir).isFile()) return [dir];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path.join(dir, e.name));
    return e.name.endsWith('.cs') ? [path.join(dir, e.name)] : [];
  });
}

const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const isTest = (f) => /06-WPApiPortalFeEc\.UnitTest/.test(rel(f));

const allFiles = walk(ROOT);
const scopeArgs = process.argv.slice(2).map((p) => path.resolve(process.cwd(), p));
for (const p of scopeArgs) if (!fs.existsSync(p)) console.error(`No existe: ${p}`);
const inScope = (f) => scopeArgs.length === 0 || scopeArgs.some((s) => f === s || f.startsWith(s + path.sep));

/** Quita comentarios conservando saltos de línea (para no perder la numeración) y deja los strings. */
function stripComments(src) {
  let out = '';
  let i = 0;
  let mode = 'code';
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (mode === 'code') {
      if (c === '/' && n === '/') { mode = 'line'; i += 2; continue; }
      if (c === '/' && n === '*') { mode = 'block'; i += 2; continue; }
      if (c === '"') { mode = src[i - 1] === '@' ? 'verbatim' : 'string'; out += c; i++; continue; }
      if (c === "'") { mode = 'char'; out += c; i++; continue; }
      out += c; i++; continue;
    }
    if (mode === 'line') { if (c === '\n') { mode = 'code'; out += c; } i++; continue; }
    if (mode === 'block') { if (c === '*' && n === '/') { mode = 'code'; i += 2; continue; } if (c === '\n') out += c; i++; continue; }
    if (mode === 'string' || mode === 'char') {
      out += c;
      if (c === '\\') { out += n ?? ''; i += 2; continue; }
      if ((mode === 'string' && c === '"') || (mode === 'char' && c === "'") || c === '\n') mode = 'code';
      i++; continue;
    }
    if (mode === 'verbatim') {
      out += c;
      if (c === '"' && n === '"') { out += n; i += 2; continue; }
      if (c === '"') mode = 'code';
      i++; continue;
    }
  }
  return out;
}

const cache = new Map();
const code = (f) => {
  if (!cache.has(f)) cache.set(f, stripComments(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')));
  return cache.get(f);
};
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

const findings = [];
const report = (level, file, line, msg) => { if (inScope(file)) findings.push({ level, file, line, msg }); };

// ── Reglas por archivo ─────────────────────────────────────────────────────────────────────────
const LINE_RULES = [
  { re: /throw\s+new\s+Exception\s*\(/, msg: 'throw new Exception: usa una excepción del dominio (references/errores.md)' },
  { re: /\)\s*\.Result\b|\.Wait\(\s*\)|\.GetAwaiter\(\)\s*\.GetResult\(\)/, msg: 'bloqueo síncrono (.Result/.Wait/GetResult): usa await', startupOk: true },
  { re: /\basync\s+void\b/, msg: 'async void: devuelve Task' },
  { re: /(FromSqlRaw|ExecuteSqlRaw(Async)?)\s*\(\s*(\$"|[^)]*"\s*\+)/, msg: 'SQL crudo con interpolación/concatenación: usa FromSqlInterpolated o parámetros' },
];

for (const f of allFiles) {
  if (isTest(f) || !inScope(f)) continue;
  const src = code(f);
  // En el arranque (registro de DI, Program.cs) no hay contexto async: ahí el bloqueo es solo un aviso.
  const isStartup = /Registration\.cs$|[\\/]Program\.cs$/.test(f);
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    // `.GetAwaiter()` y `.GetResult()` suelen ir en líneas separadas: se evalúa también la línea unida a la anterior.
    const joined = (lines[i - 1] ?? '').trimEnd() + line.trim();
    for (const r of LINE_RULES) {
      if (r.re.test(line) || (r.startupOk && /^\s*\.GetResult\(\)/.test(line) && r.re.test(joined)))
        report(r.startupOk && isStartup ? 'AVISO' : 'ERROR', f, i + 1, r.msg);
    }
  });
  // catch vacío: se mira el texto ORIGINAL, así un catch que solo lleva un comentario explicando
  // por qué se ignora la excepción no cuenta como vacío.
  const raw = fs.readFileSync(f, 'utf8');
  for (const m of raw.matchAll(/catch\s*(\([^)]*\))?\s*\{\s*\}/g))
    report('ERROR', f, lineOf(raw, m.index), 'catch vacío: registra el error, explica en un comentario por qué se ignora, o deja que suba');
}

// ── Controllers del portal ─────────────────────────────────────────────────────────────────────
const PORTAL_CONTROLLERS = path.join(ROOT, '01-WPApiPortalFeEc.API', 'Controllers');
for (const f of allFiles.filter((x) => x.startsWith(PORTAL_CONTROLLERS) && x.endsWith('Controller.cs'))) {
  const src = code(f);
  const cls = src.match(/((?:\[[^\]]*\]\s*)*)public\s+(?:sealed\s+)?class\s+(\w+)/);
  if (!cls) continue;
  const classAttrs = cls[1];
  const classAnon = /\[AllowAnonymous\]/.test(classAttrs);
  if (!/\[Authorize\b/.test(classAttrs) && !classAnon) report('ERROR', f, lineOf(src, cls.index), `${cls[2]} sin [Authorize] ni [AllowAnonymous] a nivel de clase`);
  if (classAnon || !f.includes(`${path.sep}v1${path.sep}`)) continue;

  const actionRe = /((?:\[[^\]]*\]\s*)+)public\s+(async\s+)?([\w<>\[\],\s?]+?)\s+(\w+)\s*\(([^)]*)\)/g;
  for (const m of src.matchAll(actionRe)) {
    // Los atributos de la clase aplican a todas sus acciones.
    const attrs = classAttrs + m[1];
    if (!/\[Http(Get|Post|Put|Delete|Patch)\b/.test(m[1])) continue;
    if (/\[AllowAnonymous\]/.test(attrs)) continue;
    const name = m[4];
    const line = lineOf(src, m.index + m[1].length);
    if (!/\[RequirePermission\(/.test(attrs)) report('AVISO', f, line, `${name}: sin [RequirePermission(...)] (references/seguridad.md)`);
    if (!/\[(ClaimAccess|DbRoleAccess|GlobalAdminOnly|RequireCompanyRoleFromBody)\(/.test(attrs)) report('AVISO', f, line, `${name}: sin atributo de rol ([ClaimAccess]/[DbRoleAccess])`);
    if (m[2] && !/CancellationToken/.test(m[5]) && name !== 'GetById') report('AVISO', f, line, `${name}: acción async sin CancellationToken`);
  }
}

// ── Servicios registrados ──────────────────────────────────────────────────────────────────────
const registrationText = allFiles
  .filter((f) => !isTest(f) && (/Registration\.cs$/.test(f) || /[\\/]Program\.cs$/.test(f) || /[\\/]Extensions[\\/]/.test(f)))
  .map(code)
  .join('\n');
const SERVICES_DIR = path.join(ROOT, '02-WPApiPortalFeEc.Services', 'WPApiPortalFeEc.Services.Data', 'Services');
for (const f of allFiles.filter((x) => x.startsWith(SERVICES_DIR))) {
  const src = code(f);
  for (const m of src.matchAll(/public\s+(?:sealed\s+|partial\s+)*class\s+(\w+Service)\b/g)) {
    const name = m[1];
    if (!new RegExp(`\\b${name}\\b`).test(registrationText))
      report('ERROR', f, lineOf(src, m.index), `${name} no está registrado (ServiceDataRegistration.AddServicesData)`);
  }
}

// ── Entidades con DbSet ────────────────────────────────────────────────────────────────────────
const contextText = allFiles.filter((f) => /Context\.cs$|DbContext\.cs$/.test(f) && !isTest(f)).map(code).join('\n');
const ENTITIES_DIR = path.join(ROOT, '04-WPApiPortalFeEc.Data', 'Entities');
for (const f of allFiles.filter((x) => x.startsWith(ENTITIES_DIR))) {
  const src = code(f);
  for (const m of src.matchAll(/public\s+(?:partial\s+)?class\s+(\w+)[^{]*\bIHasKeyId</g)) {
    if (!new RegExp(`DbSet<\\s*(?:[\\w.]+\\.)?${m[1]}\\s*>`).test(contextText))
      report('AVISO', f, lineOf(src, m.index), `${m[1]} no tiene DbSet en ningún DbContext (¿entidad huérfana?)`);
  }
}

// ── Update*Dto sin CompanyLicCod ───────────────────────────────────────────────────────────────
const DTO_DIR = path.join(ROOT, '05-WPApiPortalFeEc.Common', 'Dto');
for (const f of allFiles.filter((x) => x.startsWith(DTO_DIR))) {
  const src = code(f);
  for (const m of src.matchAll(/public\s+(?:partial\s+)?class\s+(Update\w*Dto)\b[^{]*\{/g)) {
    const start = m.index + m[0].length;
    let depth = 1, i = start;
    while (i < src.length && depth > 0) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
    const body = src.slice(start, i);
    const p = body.search(/public\s+string\??\s+CompanyLicCod\b/);
    if (p >= 0) report('ERROR', f, lineOf(src, start + p), `${m[1]} expone CompanyLicCod (permite mover el registro de empresa)`);
  }
}

// ── Salida ─────────────────────────────────────────────────────────────────────────────────────
const errors = findings.filter((x) => x.level === 'ERROR');
const warns = findings.filter((x) => x.level === 'AVISO');
const scanned = allFiles.filter((f) => !isTest(f) && inScope(f)).length;

if (findings.length === 0) {
  console.log(`check-backend: OK — ${scanned} archivo(s) .cs revisados.`);
  process.exit(0);
}
findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
let current = '';
for (const x of findings) {
  const r = rel(x.file);
  if (r !== current) { console.log(`\n${r}`); current = r; }
  console.log(`  ${x.line}: [${x.level}] ${x.msg}`);
}
console.log(`\ncheck-backend: ${errors.length} error(es), ${warns.length} aviso(s) en ${scanned} archivo(s) revisados.`);
process.exit(errors.length ? 1 : 0);
