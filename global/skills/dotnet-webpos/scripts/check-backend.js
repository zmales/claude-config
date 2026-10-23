#!/usr/bin/env node
/**
 * Validaciones deterministas de las normas .NET de WebPOS (ver ../references/).
 * Pensado para soluciones con la estructura numerada de WebPOS (01-*.API, 02-*.Services, 03-*.Infraestructure,
 * 04-*.Data, 05-*.Common, 06-*.UnitTest). Busca la raíz subiendo hasta encontrar un *.sln.
 *
 *   ERROR  - controller de 01-*.API sin [Authorize] ni [AllowAnonymous] a nivel de clase
 *          - throw new Exception(...)
 *          - catch vacío (sin ni siquiera un comentario)
 *          - bloqueo síncrono: `).Result`, `<variableTask>.Result`, .Wait(), .GetAwaiter().GetResult(); async void
 *          - FromSqlRaw / ExecuteSqlRaw con interpolación o concatenación
 *          - clase *Service de Services.Data/Services sin registrar en ningún *Registration.cs / Program.cs / Extensions
 *          - Update*Dto que expone CompanyLicCod
 *   AVISO  - entidad (IHasKeyId) sin DbSet en ningún DbContext
 *          - bloqueo síncrono en código de arranque (*Registration.cs / Program.cs)
 *          - acción de Controllers/v<N> sin [RequirePermission] (salvo [AllowAnonymous] o [GlobalAdminOnly])
 *          - acción sin atributo de rol ([ClaimAccess]/[DbRoleAccess]/[RequireCompanyRoleFromBody])
 *          - acción async (o que devuelve Task sin `async`) sin CancellationToken, salvo que solo delegue en
 *            métodos de la base que no lo aceptan (GetByIdAsync/GetAllAsync/GetEntityByFilter)
 *
 * Heurísticas (documentadas para no sorprender):
 *   - `x.Result` solo se marca si `x` termina en "task" (task, saveTask, …) o se declaró en el mismo archivo como
 *     Task/ValueTask o como `var x = …Async(…)` sin await. Así no se marcan DTOs con una propiedad `Result`.
 *   - [GlobalAdminOnly] es solo metadata (no autoriza): silencia el aviso de [RequirePermission] (catálogo global,
 *     no hay empresa contra la que evaluar el permiso), pero la acción sigue necesitando [ClaimAccess]/[DbRoleAccess].
 *   - El chequeo de registro DI solo mira CLASES *Service (no interfaces sueltas).
 *
 * Uso (desde la raíz de la solución o cualquier subcarpeta):
 *   node "$HOME/.claude/skills/dotnet-webpos/scripts/check-backend.js" [rutas...]
 * Sin rutas revisa toda la solución. Con rutas, SOLO analiza esas carpetas/archivos; para decidir si un servicio
 * está registrado o una entidad tiene DbSet se leen además los *Registration.cs / Program.cs / Extensions y los
 * *Context.cs de la solución.
 * Sale con código 1 si hay ERRORES (los AVISOS no cambian el código de salida).
 */
const fs = require('fs');
const path = require('path');

function findRoot(dir) {
  let d = dir;
  while (true) {
    if (fs.existsSync(d) && fs.readdirSync(d).some((n) => n.endsWith('.sln'))) return d;
    const parent = path.dirname(d);
    if (parent === d) return null;
    d = parent;
  }
}

const ROOT = findRoot(process.cwd());
if (!ROOT) {
  console.error('No se encontró ningún .sln subiendo desde el directorio actual. Ejecuta el script dentro del repo de la API.');
  process.exit(2);
}

const SKIP_DIRS = new Set(['bin', 'obj', 'Migrations', 'node_modules', 'TestResults', '.git', '.claude', '.vs', 'zz-SriTestHarness']);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  if (fs.statSync(dir).isFile()) return dir.endsWith('.cs') ? [dir] : [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(path.join(dir, e.name));
    return e.name.endsWith('.cs') ? [path.join(dir, e.name)] : [];
  });
}

const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const isTest = (f) => /^06-|UnitTest|\.Tests?\//.test(rel(f));
const isPortalController = (f) => /^01-[^/]+\.API\/Controllers\/.*Controller\.cs$/i.test(rel(f));
const isVersionedController = (f) => /\/Controllers\/v\d+\//.test(rel(f));
const isDataService = (f) => /Services\.Data\/Services\//.test(rel(f));
const isEntity = (f) => /^04-[^/]+\.Data\/Entities\//.test(rel(f));
const isDto = (f) => /^05-[^/]+\.Common\/Dto\//.test(rel(f));
const isRegistration = (f) => /Registration\.cs$/.test(f) || /[\\/]Program\.cs$/.test(f) || /\/Extensions\//.test(rel(f));
const isContext = (f) => /Context\.cs$/.test(f);

// ── Alcance ────────────────────────────────────────────────────────────────────────────────────
const scopeArgs = process.argv.slice(2).map((p) => path.resolve(process.cwd(), p));
for (const p of scopeArgs) if (!fs.existsSync(p)) console.error(`No existe: ${p}`);
const scopedFiles = scopeArgs.length === 0 ? walk(ROOT) : [...new Set(scopeArgs.flatMap(walk))];

// Archivos de soporte (solo se leen si hacen falta): registro DI y DbContexts de toda la solución.
let supportFiles = null;
const solutionSupport = () => {
  if (!supportFiles) {
    const tops = fs.readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory() && /^0[1-5]-/.test(e.name));
    supportFiles = tops.flatMap((e) => walk(path.join(ROOT, e.name))).filter((f) => isRegistration(f) || isContext(f));
  }
  return supportFiles;
};

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

/** Cuerpo de un miembro que empieza en `from`: bloque `{…}` balanceado o expresión `=> …;`. */
function memberBody(src, from) {
  let i = from;
  while (i < src.length && src[i] !== '{' && !(src[i] === '=' && src[i + 1] === '>')) i++;
  if (src[i] === '{') {
    let depth = 0;
    const start = i;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}' && --depth === 0) return src.slice(start, i + 1);
    }
    return src.slice(start);
  }
  const end = src.indexOf(';', i);
  return src.slice(i, end < 0 ? undefined : end + 1);
}

const findings = [];
const report = (level, file, line, msg) => findings.push({ level, file, line, msg });

// ── Reglas por línea ───────────────────────────────────────────────────────────────────────────
const LINE_RULES = [
  { re: /throw\s+new\s+Exception\s*\(/, msg: 'throw new Exception: usa una excepción del dominio (references/errores.md)' },
  { re: /\)\s*\.Result\b|\.Wait\(\s*\)|\.GetAwaiter\(\)\s*\.GetResult\(\)/, msg: 'bloqueo síncrono (.Result/.Wait/GetResult): usa await', blocking: true },
  { re: /\basync\s+void\b/, msg: 'async void: devuelve Task' },
  { re: /(FromSqlRaw|ExecuteSqlRaw(Async)?)\s*\(\s*(\$"|[^)]*"\s*\+)/, msg: 'SQL crudo con interpolación/concatenación: usa FromSqlInterpolated o parámetros' },
];

/** Variables del archivo que con seguridad razonable son Task: `Task<…> x =`, `ValueTask x =`, `var x = Foo…Async(` sin await. */
function taskVariables(src) {
  const names = new Set();
  for (const m of src.matchAll(/\b(?:Value)?Task(?:<[^;=()]*>)?\s+(\w+)\s*=/g)) names.add(m[1]);
  for (const m of src.matchAll(/\bvar\s+(\w+)\s*=\s*(?!await\b)[\w.]*?\w+Async\s*\(/g)) names.add(m[1]);
  for (const m of src.matchAll(/\bvar\s+(\w+)\s*=\s*Task\.(?:Run|WhenAll|WhenAny|FromResult)\b/g)) names.add(m[1]);
  return names;
}

for (const f of scopedFiles) {
  if (isTest(f)) continue;
  const src = code(f);
  // En el arranque (registro de DI, Program.cs) no hay contexto async: ahí el bloqueo es solo un aviso.
  const isStartup = /Registration\.cs$|[\\/]Program\.cs$/.test(f);
  const tasks = taskVariables(src);
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    // `.GetAwaiter()` y `.GetResult()` suelen ir en líneas separadas: se evalúa también la línea unida a la anterior.
    const joined = (lines[i - 1] ?? '').trimEnd() + line.trim();
    for (const r of LINE_RULES) {
      if (r.re.test(line) || (r.blocking && /^\s*\.GetResult\(\)/.test(line) && r.re.test(joined)))
        report(r.blocking && isStartup ? 'AVISO' : 'ERROR', f, i + 1, r.msg);
    }
    for (const m of line.matchAll(/\b(\w+)\s*\.Result\b/g)) {
      if (/task$/i.test(m[1]) || tasks.has(m[1]))
        report(isStartup ? 'AVISO' : 'ERROR', f, i + 1, `bloqueo síncrono (${m[1]}.Result): usa await`);
    }
  });
  // catch vacío: se mira el texto ORIGINAL, así un catch que solo lleva un comentario explicando
  // por qué se ignora la excepción no cuenta como vacío.
  const raw = fs.readFileSync(f, 'utf8');
  for (const m of raw.matchAll(/catch\s*(\([^)]*\))?\s*\{\s*\}/g))
    report('ERROR', f, lineOf(raw, m.index), 'catch vacío: registra el error, explica en un comentario por qué se ignora, o deja que suba');
}

// ── Controllers de la API (01) ─────────────────────────────────────────────────────────────────
// Métodos de CrudService/TenantCrudService que no aceptan CancellationToken: una acción que solo delega en
// ellos no tiene a quién pasar el token.
const NO_CT_BASE_METHODS = new Set(['GetByIdAsync', 'GetAllAsync', 'GetEntityByFilter']);
for (const f of scopedFiles.filter(isPortalController)) {
  const src = code(f);
  const cls = src.match(/((?:\[[^\]]*\]\s*)*)public\s+(?:sealed\s+|partial\s+)*class\s+(\w+)/);
  if (!cls) continue;
  const classAttrs = cls[1];
  const classAnon = /\[AllowAnonymous\]/.test(classAttrs);
  if (!/\[Authorize\b/.test(classAttrs) && !classAnon) report('ERROR', f, lineOf(src, cls.index), `${cls[2]} sin [Authorize] ni [AllowAnonymous] a nivel de clase`);
  if (classAnon || !isVersionedController(f)) continue;

  const actionRe = /((?:\[[^\]]*\]\s*)+)public\s+(async\s+)?([\w<>\[\],\s?]+?)\s+(\w+)\s*\(([^)]*)\)/g;
  for (const m of src.matchAll(actionRe)) {
    // Los atributos de la clase aplican a todas sus acciones.
    const attrs = classAttrs + m[1];
    if (!/\[Http(Get|Post|Put|Delete|Patch)\b/.test(m[1])) continue;
    if (/\[AllowAnonymous\]/.test(attrs)) continue;
    const name = m[4];
    const line = lineOf(src, m.index + m[1].length);
    const globalAdminOnly = /\[GlobalAdminOnly\(/.test(attrs);
    if (!/\[RequirePermission\(/.test(attrs) && !globalAdminOnly)
      report('AVISO', f, line, `${name}: sin [RequirePermission(...)] (references/seguridad.md)`);
    if (!/\[(ClaimAccess|DbRoleAccess|RequireCompanyRoleFromBody)\(/.test(attrs))
      report('AVISO', f, line, `${name}: sin atributo de rol ([ClaimAccess]/[DbRoleAccess])${globalAdminOnly ? ' — [GlobalAdminOnly] no autoriza por sí solo' : ''}`);

    const returnsTask = /^(Value)?Task\b/.test(m[3].trim());
    if ((m[2] || returnsTask) && !/CancellationToken/.test(m[5])) {
      const body = memberBody(src, m.index + m[0].length);
      const calls = [...body.matchAll(/\.\s*(\w+)\s*(?:<[^()]*>)?\s*\(/g)].map((c) => c[1]).filter((c) => /Async$|^GetEntityByFilter$/.test(c));
      const onlyBase = calls.length > 0 && calls.every((c) => NO_CT_BASE_METHODS.has(c));
      if (!onlyBase) report('AVISO', f, line, `${name}: acción async sin CancellationToken`);
    }
  }
}

// ── Servicios registrados (solo clases *Service) ───────────────────────────────────────────────
const serviceFiles = scopedFiles.filter((f) => isDataService(f) && !isTest(f));
if (serviceFiles.length) {
  const registrationText = solutionSupport().filter((f) => isRegistration(f) && !isTest(f)).map(code).join('\n');
  for (const f of serviceFiles) {
    const src = code(f);
    for (const m of src.matchAll(/public\s+(?:sealed\s+|partial\s+)*class\s+(\w+Service)\b/g)) {
      if (!new RegExp(`\\b${m[1]}\\b`).test(registrationText))
        report('ERROR', f, lineOf(src, m.index), `${m[1]} no está registrado (ServiceDataRegistration / *Registration.cs)`);
    }
  }
}

// ── Entidades con DbSet ────────────────────────────────────────────────────────────────────────
const entityFiles = scopedFiles.filter(isEntity);
if (entityFiles.length) {
  const contextText = solutionSupport().filter((f) => isContext(f) && !isTest(f)).map(code).join('\n');
  for (const f of entityFiles) {
    const src = code(f);
    for (const m of src.matchAll(/public\s+(?:partial\s+)?class\s+(\w+)[^{]*\bIHasKeyId</g)) {
      if (!new RegExp(`DbSet<\\s*(?:[\\w.]+\\.)?${m[1]}\\s*>`).test(contextText))
        report('AVISO', f, lineOf(src, m.index), `${m[1]} no tiene DbSet en ningún DbContext (¿entidad huérfana?)`);
    }
  }
}

// ── Update*Dto sin CompanyLicCod ───────────────────────────────────────────────────────────────
for (const f of scopedFiles.filter(isDto)) {
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
const scanned = scopedFiles.filter((f) => !isTest(f)).length;

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
