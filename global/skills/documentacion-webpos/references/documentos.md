# Documentos del repositorio (README, ADR, guías)

Basado en los documentos reales: `ARCHITECTURE_DECISIONS_V1.md`, `ExceptionHandlingGuide.md`,
`LoggingGuide.md`, `DEVELOPER_SETUP.md` (backend) y `documentacion/*.md` (portal).

## Convenciones comunes

- Español, Markdown. Un `#` por documento; secciones `##` **numeradas** en documentos de
  arquitectura (`## 5. Flujo de emisión electrónica (ADR-002)`, `### 5.1 …`), sin numerar en guías.
- Ubicación: en la raíz del repo los documentos transversales del backend (`*Guide.md`,
  `ARCHITECTURE_DECISIONS_V1.md`, `DEPLOYMENT.md`); en el portal, carpeta `documentacion/` con nombres
  en MAYÚSCULAS y guiones (`GUIA-USUARIOS-ROLES-MENUS.md`).
- Tablas para comparar o mapear (excepción → HTTP status, API Portal vs B2B), bloques de código con
  lenguaje, árboles de carpetas en bloque sin lenguaje.
- Ejemplos reales del repo, no `foo/bar`. Ejemplos de "✅ Correcto / ❌ Incorrecto" cuando se fija una
  regla (como en `ExceptionHandlingGuide.md`).
- Cita tareas y decisiones (`TASK-29`, `ADR-011`) y enlaza secciones internas (`ver sección 7`).
- Nada de secretos, cadenas de conexión reales ni datos de clientes.
- Emojis: no los añadas a documentos nuevos; respeta los existentes si el archivo ya los usa.

## README

El README de un repo WebPOS debe permitir arrancar el proyecto sin preguntar a nadie. Si el README
actual es el genérico del CLI, sustitúyelo solo si el usuario lo pide.

```markdown
# <Nombre del proyecto>

<Una frase: qué es y para quién.>

## Requisitos
- .NET 8 SDK / Node <versión> y Angular CLI 20
- <BD, herramientas>

## Puesta en marcha
1. <clonar, restaurar dependencias>
2. <configuración local: user-secrets / env — remitir a DEVELOPER_SETUP.md o ENV_SETUP.md>
3. <comando para ejecutar>

## Pruebas
<comando y alcance>

## Estructura
<árbol corto de carpetas principales con una línea cada una>

## Documentación
- [Arquitectura](./ARCHITECTURE_DECISIONS_V1.md)
- [Guía de …](./…)

## Flujo de trabajo
Ramas, rama de integración y convenciones de commit: ver CLAUDE.md / guía del equipo.
```

## ADR (decisiones de arquitectura)

En WebPOS las decisiones se numeran `ADR-NNN` y se consolidan en un documento de arquitectura del
repo (`ARCHITECTURE_DECISIONS_V1.md`), donde cada sección relevante indica el ADR que la origina. Para
una decisión nueva, añade una sección o subsección con esta forma:

```markdown
## N. <Tema> (ADR-NNN)

**Contexto.** Qué problema o restricción obliga a decidir (volumen, SRI, multi-tenant, costo).

**Decisión.** Qué se hace, en concreto (clases, contratos, tablas implicadas).

**Alternativas descartadas.** Opción — motivo por el que no.

**Consecuencias.** Qué se gana, qué se paga, qué queda pendiente (enlazar a "Limitaciones conocidas").
```

- Una decisión reemplazada no se borra: se marca `Reemplazada por ADR-NNN`.
- Las convenciones del equipo derivadas de ADRs van en la sección de convenciones (en
  WPApiPortalFeEc, §13) con su lista de **No hacer**.

## Guía técnica (`<Tema>Guide.md` / `GUIA-<TEMA>.md`)

Estructura usada en `ExceptionHandlingGuide.md` y `LoggingGuide.md`:

```markdown
# Guía de <tema> — <proyecto>

## Descripción general
<Qué resuelve el sistema y lista corta de capacidades.>

## Estructura / Configuración
<Jerarquía de clases, ubicación de archivos, appsettings relevantes.>

## Cómo usar
### 1. En <capa A>
#### Ejemplo: <caso real>
### 2. En <capa B>
#### ✅ Correcto
#### ❌ Incorrecto

## Mejores prácticas
### ✅ Hacer
### ❌ No hacer

## Testing
## Extensión del sistema
## Troubleshooting
```

## Guía de pasos (setup, despliegue)

Como `DEVELOPER_SETUP.md`: `## Requisitos previos`, luego `## Paso 1: …`, `## Paso 2: …` con el
comando exacto de cada paso, y al final `## Comandos útiles` y `## Notas`. Cada paso verificable
("deberías ver…").

## CHANGELOG (si el proyecto lo lleva)

Formato Keep a Changelog, en español: `## [Sin publicar]`, `## [x.y.z] - AAAA-MM-DD` con `### Añadido`,
`### Cambiado`, `### Corregido`, `### Eliminado`. Las entradas salen de los commits Conventional.

## Checklist

- [ ] ¿Existe ya un documento sobre el tema? (ampliar antes que crear)
- [ ] ¿Sigue la estructura del documento hermano más parecido?
- [ ] ¿Ejemplos reales del repo y comandos copiables?
- [ ] ¿TASK/ADR citados, sin secretos?
- [ ] ¿Enlazado desde README o desde la guía índice?
