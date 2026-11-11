#!/usr/bin/env node
/**
 * Hooks de los agentes frontend-angular y backend-dotnet (declarados en el frontmatter de cada agente).
 * Convierte en obligatorias, por código, reglas que antes solo estaban en el prompt.
 *
 *   node agentes.js registrar        PostToolUse (Edit|Write|MultiEdit): anota el archivo tocado.
 *   node agentes.js git              PreToolUse (Bash): bloquea push a main/master, --force y subir .claude/.
 *   node agentes.js validar front    Stop: check-styles (+ check-i18n si tocó traducciones) en lo tocado.
 *   node agentes.js validar back     Stop: check-backend en los .cs tocados.
 *
 * Si la validación falla, sale con código 2: el agente no puede terminar y recibe los hallazgos para corregirlos.
 * Tras MAX_INTENTOS bloqueos seguidos lo deja terminar, para no entrar en un bucle; el agente debe reportarlo.
 * Solo se validan los archivos que tocó el agente: la deuda previa del repo no bloquea.
 * Un validador que no puede ejecutarse (sin node_modules, sin .sln) no bloquea.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const MAX_INTENTOS = 3;
const SKILLS = path.join(os.homedir(), '.claude', 'skills');
const ESTADO_DIR = path.join(os.tmpdir(), 'claude-webpos-hooks');

function leerEntrada() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

/** Un archivo de estado por agente en ejecución (agent_id) o, si no viene, por sesión. */
function archivoEstado(entrada) {
  const clave = String(entrada.agent_id || entrada.session_id || 'sin-sesion').replace(/[^\w.-]/g, '_');
  return path.join(ESTADO_DIR, `${clave}.json`);
}

function leerEstado(archivo) {
  try {
    return JSON.parse(fs.readFileSync(archivo, 'utf8'));
  } catch {
    return { archivos: [], intentos: 0 };
  }
}

function guardarEstado(archivo, estado) {
  fs.mkdirSync(ESTADO_DIR, { recursive: true });
  fs.writeFileSync(archivo, JSON.stringify(estado));
}

function borrarEstado(archivo) {
  try {
    fs.unlinkSync(archivo);
  } catch {}
}

function bloquear(mensaje) {
  process.stderr.write(mensaje.trim() + '\n');
  process.exit(2);
}

// ── registrar ────────────────────────────────────────────────────────────────────────────────────
function registrar(entrada) {
  const ti = entrada.tool_input || {};
  const ruta = ti.file_path || ti.notebook_path;
  if (!ruta) return;
  const abs = path.resolve(entrada.cwd || process.cwd(), ruta);
  const archivo = archivoEstado(entrada);
  const estado = leerEstado(archivo);
  if (!estado.archivos.includes(abs)) estado.archivos.push(abs);
  guardarEstado(archivo, estado);
}

// ── git ──────────────────────────────────────────────────────────────────────────────────────────
const REGLAS_GIT = [
  {
    re: /\bgit\b[^;&|]*\bpush\b[^;&|]*(\s--force(-with-lease)?\b|\s-[a-zA-Z]*f\b|\s\+\S)/,
    msg: 'push forzado (--force, -f, +rama) prohibido por las normas de WebPOS.',
  },
  {
    re: /\bgit\b[^;&|]*\bpush\b[^;&|]*[\s:](main|master)\b/,
    msg: 'push a main/master prohibido: usa la rama de integración del proyecto y un PR.',
  },
  {
    re: /\bgit\b[^;&|]*\b(add|commit)\b[^;&|]*(^|\s|["'/])\.claude([\\/"'\s]|$)/,
    msg: 'la carpeta .claude/ nunca se sube a GitHub.',
  },
  {
    re: /\bgit\b[^;&|]*\badd\b[^;&|]*\s(-f|--force)\b/,
    msg: 'git add --force saltaría el .gitignore (que protege .claude/ y secretos).',
  },
];

function git(entrada) {
  const cmd = (entrada.tool_input || {}).command || '';
  for (const { re, msg } of REGLAS_GIT) {
    if (re.test(cmd)) bloquear(`Bloqueado por hook de WebPOS: ${msg}\nComando: ${cmd}`);
  }
}

// ── validar ──────────────────────────────────────────────────────────────────────────────────────
function correr(script, args, cwd) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return { codigo: r.status, salida: `${r.stdout || ''}${r.stderr || ''}`.trim() };
}

/**
 * check-i18n revisa toda la carpeta de idiomas: se queda solo con los bloques de los archivos tocados
 * y sus pares (x.es.ts ↔ x.en.ts), para no bloquear por deuda ajena.
 */
function filtrarI18n(salida, tocados, cwd) {
  const tallo = (f) => f.replace(/\\/g, '/').replace(/\.(es|en)\.ts$/, '').replace(/(^|\/)(es|en)\.ts$/, '$1<raiz>');
  const propios = new Set(tocados.map((f) => tallo(path.relative(cwd, f))));
  const bloques = salida.split(/\n(?=\S)/).filter((b) => !/^check-i18n:/.test(b.trim()));
  return bloques.filter((b) => propios.has(tallo(b.split('\n')[0].trim()))).join('\n').trim();
}

function validarFront(tocados, cwd) {
  const hallazgos = [];
  const estilos = tocados.filter((f) => /\.(ts|html|scss)$/.test(f) && !/\.spec\.ts$/.test(f));
  if (estilos.length) {
    const r = correr(path.join(SKILLS, 'angular-webpos', 'scripts', 'check-styles.js'), estilos, cwd);
    if (r.codigo === 1) hallazgos.push(`### check-styles\n${r.salida}`);
  }
  const i18n = tocados.filter((f) => /(^|[\\/.])(es|en)\.ts$/.test(f));
  if (i18n.length) {
    const r = correr(path.join(SKILLS, 'angular-webpos', 'scripts', 'check-i18n.js'), [], cwd);
    if (r.codigo === 1) {
      const propios = filtrarI18n(r.salida, i18n, cwd);
      if (propios) hallazgos.push(`### check-i18n\n${propios}`);
    }
  }
  return hallazgos;
}

function validarBack(tocados, cwd) {
  const cs = tocados.filter((f) => /\.cs$/.test(f) && !/[\\/]Migrations[\\/]/.test(f));
  if (!cs.length) return [];
  const r = correr(path.join(SKILLS, 'dotnet-webpos', 'scripts', 'check-backend.js'), cs, cwd);
  return r.codigo === 1 ? [`### check-backend\n${r.salida}`] : [];
}

function validar(entrada, tipo) {
  const archivo = archivoEstado(entrada);
  const estado = leerEstado(archivo);
  const cwd = entrada.cwd || process.cwd();
  const tocados = estado.archivos.filter((f) => fs.existsSync(f));
  const hallazgos = tipo === 'back' ? validarBack(tocados, cwd) : validarFront(tocados, cwd);

  if (!hallazgos.length) return borrarEstado(archivo);
  if (estado.intentos >= MAX_INTENTOS) {
    borrarEstado(archivo);
    process.stderr.write(`Validación con hallazgos tras ${MAX_INTENTOS} intentos; se permite terminar.\n`);
    return;
  }
  estado.intentos += 1;
  guardarEstado(archivo, estado);
  bloquear(
    `La validación automática encontró problemas en los archivos que tocaste ` +
      `(intento ${estado.intentos} de ${MAX_INTENTOS}). Corrígelos antes de terminar. ` +
      `Si alguno es un falso positivo o no puedes corregirlo, explícalo en "Pendiente / decisiones" del reporte.\n\n` +
      hallazgos.join('\n\n')
  );
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────────
const [modo, tipo] = process.argv.slice(2);
const entrada = leerEntrada();
try {
  if (modo === 'registrar') registrar(entrada);
  else if (modo === 'git') git(entrada);
  else if (modo === 'validar') validar(entrada, tipo);
  else process.stderr.write(`agentes.js: modo desconocido "${modo}"\n`);
} catch (err) {
  // Un fallo del propio hook nunca debe bloquear al agente.
  process.stderr.write(`agentes.js (${modo}): ${err.message}\n`);
  process.exit(0);
}
