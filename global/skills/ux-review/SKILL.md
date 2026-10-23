---
name: ux-review
description: Checklist y plantilla para evaluar la experiencia de usuario (UX) y la accesibilidad de una vista, pantalla, formulario o componente web de un proyecto WebPOS, con criterios WCAG 2.1 AA y heurísticas de Nielsen, y producir un informe priorizado en español. Uso interno de los agentes ux-review (auditoría) y design-fix (aplicar correcciones); cubre consistencia de botones, legibilidad, contraste, uso del color, campos requeridos, mensajes de error, microcopy, estados de carga, teclado y responsive.
user-invocable: false
---

# ux-review — Revisión de UX y accesibilidad

Audita la experiencia de usuario y la accesibilidad de una vista web y devuelve un informe
**en español, en Markdown**, priorizado y accionable, donde cada hallazgo se justifica con un principio
reconocido (un criterio WCAG 2.1 o una heurística de Nielsen). El objetivo es un feedback concreto y
didáctico, nunca genérico.

## Stack de referencia en WebPOS

Los portales WebPOS usan **Angular 20 + Bootstrap 5.3 + Bootstrap Icons** y un **sistema de diseño
propio con tokens CSS** (color primario `--brand-600`, al que apunta `--bs-primary`; ver la skill
`angular-webpos` → `references/estilos.md`). No se usa PrimeNG. Angular Material puede aparecer en
pantallas antiguas, pero **no es la norma**: no lo tomes como referencia de consistencia ni lo
recomiendes en correcciones. Patrones UX propios: `wpBlockUI` para carga, ngx-toastr para
notificaciones y SweetAlert2 para confirmaciones destructivas.

Si la vista pertenece a otro stack, confírmalo antes de evaluar: el checklist es el mismo, solo cambia
*dónde* mirar en el código.

## Regla principal: preguntar antes de suponer

**No tomes decisiones ni interpretaciones por el usuario.** Si falta algo necesario, es ambiguo o no
se puede verificar con las entradas disponibles, detente y pregunta (si corres como subagente y no
puedes preguntar, devuelve la pregunta en tu respuesta o marca el punto como **"no verificado"**). Aplica
a, entre otros:

- Alcance: qué vista(s) y si es una o varias.
- Si un patrón es intencional (convención del sistema de diseño) o un defecto.
- El comportamiento esperado de un control o cómo leer un elemento ambiguo.
- Lo que no se confirma con código/captura (contraste real sin render, orden de foco sin la app).

Nunca afirmes un "cumple" o "no cumple" que no puedas sostener. Si la severidad de un hallazgo es
dudosa (Alta vs. Media), señala la duda en vez de decidir en silencio. Esta regla no impide aplicar la
rúbrica de prioridades a hechos que **sí** tienes; prohíbe inventar hechos.

## Flujo

Sigue los pasos en orden; la calidad del informe depende del contexto.

### 1. Reunir las entradas

La revisión más completa combina **código fuente + captura** de la vista renderizada. El código revela
estructura (labels, marcas de requerido, textos de error, markup de botones, ARIA, semántica); la
captura revela lo que el usuario percibe (contraste real, espaciado, jerarquía, alineación).

- Con solo una de las dos, continúa pero dilo en el informe e indica qué comprobaciones quedan
  limitadas.
- Sin ninguna, pide el código del componente/plantilla o una captura antes de seguir.

### 2. Establecer el contexto

- Confirma que la vista usa el stack de referencia de arriba; si hay piezas legadas (Material, estilos
  ad hoc), anótalo en **Contexto**.
- Usa el sistema de diseño (tokens, componentes `wp-*`, patrones UX) como fuente de verdad para la
  consistencia. Donde no diga nada, aplica WCAG 2.1 AA + Nielsen y dilo.
- Pregunta solo lo que la petición necesita, pero no sustituyas por un valor por defecto lo que
  puedes obtener preguntando.

### 3. Evaluar

Recorre todas las categorías del checklist. Para cada problema identifica el principio que lo respalda
(criterio WCAG concreto o heurística de Nielsen con nombre). Consulta
[references/wcag-nielsen.md](references/wcag-nielsen.md) para umbrales exactos, la fórmula de contraste
y cómo comprobar cada punto desde código o desde captura.

Si son **varias vistas**, evalúa cada una en su sección y añade arriba una lista consolidada de
prioridades para que se vea primero lo más importante de todo el flujo.

### 4. Señalar lo que ya funciona bien

Antes de los problemas, identifica 2-4 aciertos reales (labels claros, buen contraste, componentes
consistentes, estados vacíos útiles…), cada uno ligado a su principio. Dice al equipo qué conservar y
equilibra el informe. No los inventes.

### 5. Asignar prioridad

Usa exactamente esta rúbrica (las etiquetas aparecen tal cual en el informe):

- **Alta** — Rompe la experiencia o excluye usuarios: no se puede completar la tarea, leer texto
  esencial, percibir un error, o la vista es inaccesible para tecnologías de apoyo. (Contraste bajo el
  mínimo en texto de cuerpo, error genérico/técnico que oculta qué pasó, campo sin label, información
  solo por color.)
- **Media** — Funciona, pero cuesta leer, entender o confiar. (Botones inconsistentes, líneas muy
  largas, mensaje vago pero recuperable, jerarquía visual débil.)
- **Baja** — Sugerencia / pulido. (Microcopy, ajustes de espaciado, texto de ayuda opcional.)

**No fuerces ni inventes hallazgos.** Reporta solo lo que existe y puedes respaldar con WCAG o Nielsen.
Si un nivel no tiene hallazgos reales, escribe **"Sin hallazgos."**. Es válido que uno o los tres niveles
estén vacíos: el valor del informe es su exactitud, no su cantidad.

### 6. Redactar el informe

En español y Markdown, con la plantilla exacta de abajo.

## Checklist de evaluación

El paréntesis indica el principio principal; detalles y umbrales en `references/wcag-nielsen.md`.

1. **Consistencia y jerarquía visual** — los botones comparten estilo, tamaño, convención de texto y
   ubicación; acción primaria (`btn-primary` / `--brand-600`) distinguible de las secundarias; la
   jerarquía guía la vista. (Nielsen #4 consistencia y estándares, #8 diseño estético y minimalista;
   WCAG 3.2.4.)
2. **Legibilidad y tipografía** — tamaño, peso y longitud de línea legibles; el texto se amplía y
   tolera cambios de espaciado sin romperse. (WCAG 1.4.4, 1.4.12.)
3. **Contraste de color** — texto ≥ 4.5:1 (normal) y ≥ 3:1 (grande); UI no textual con significado
   (iconos, bordes, estados) ≥ 3:1. (WCAG 1.4.3, 1.4.11.)
4. **Uso del color** — la información nunca se transmite solo con color (errores, requeridos, estados,
   enlaces). (WCAG 1.4.1.)
5. **Formularios e indicadores de requerido** — cada campo tiene label visible y programático
   (`for`/`id`); los requeridos se marcan con algo más que color; instrucciones claras y
   `autocomplete` donde aplique. (WCAG 3.3.2, 1.3.1, 1.3.5.)
6. **Mensajes de error** — identificados con claridad, en lenguaje del usuario y con sugerencia de
   corrección. Trata como **hallazgos separados** cuando aparezcan ambos: (a) mensajes *genéricos* sin
   causa ni salida ("Error", "Algo salió mal") y (b) mensajes *técnicos* que filtran internos (stack
   traces, nombres de excepción, códigos HTTP). Cada uno falla por su motivo y necesita su arreglo.
   (WCAG 3.3.1, 3.3.3; Nielsen #9 ayudar a reconocer y recuperarse de errores, #2 relación con el
   mundo real.)
7. **Microcopy y lenguaje** — etiquetas, botones y mensajes en el idioma del usuario, sin jerga interna;
   textos traducidos (no claves i18n visibles); el label visible coincide con el nombre accesible.
   (Nielsen #2; WCAG 2.5.3.)
8. **Feedback y estado del sistema** — estados de carga, éxito, vacío y deshabilitado visibles; los
   cambios importantes se anuncian a tecnologías de apoyo. (Nielsen #1; WCAG 4.1.3.)
9. **Accesibilidad y teclado** — estructura semántica y encabezados, `alt` en imágenes con significado,
   elementos interactivos enfocables con foco visible (`:focus-visible`, nunca `outline: none` sin
   reemplazo), orden de foco lógico. (WCAG 1.1.1, 1.3.1, 2.1.1, 2.4.7, 4.1.2.)
10. **Responsive e interacción táctil** — el contenido se reacomoda en anchos pequeños sin scroll
    horizontal ni recortes, funciona en ambas orientaciones, objetivos táctiles cómodos y sin depender
    de gestos. (WCAG 1.4.10, 1.3.4, 2.5.1; tamaño de objetivo —AAA en 2.1— como recomendación.)
11. **Prevención de errores y carga cognitiva** — confirmación (SweetAlert2) en acciones destructivas,
    valores por defecto sensatos, reconocer antes que recordar. (Nielsen #5, #6.)

## Plantilla del informe

Usa SIEMPRE esta estructura. Mantén las tres secciones de prioridad; si un nivel no tiene hallazgos,
escribe "Sin hallazgos." bajo su título.

```markdown
# Revisión de experiencia de usuario — [nombre de la vista]

**Contexto:** [Angular 20 + Bootstrap 5.3 + sistema de diseño WebPOS · piezas legadas si las hay · entradas usadas: código y/o captura]
**Estándares aplicados:** WCAG 2.1 (AA) y heurísticas de Nielsen

## Resumen
[2-3 frases: estado general de la vista y los temas más importantes a atender.]

## Lo que funciona bien
- [Acierto concreto y, entre paréntesis, el principio que respeta.]
- ...

## Prioridad Alta
1. **[Título corto del hallazgo]**
   - **Qué:** [descripción concreta de lo que ocurre y dónde.]
   - **Por qué:** [criterio WCAG o heurística de Nielsen, y por qué afecta al usuario.]
   - **Recomendación:** [acción concreta para corregirlo.]
   - **Código sugerido:** [snippet corto con la corrección cuando sea un cambio de código; omitir si no aplica.]

## Prioridad Media
1. **[Título corto del hallazgo]**
   - **Qué:** ...
   - **Por qué:** ...
   - **Recomendación:** ...

## Prioridad Baja
Sin hallazgos.    <!-- usar cuando no haya hallazgos reales; si los hay, listarlos con el mismo formato -->
```

Con varias vistas, repite las secciones bajo un `## [Vista]` por cada una y añade al principio
`## Prioridades consolidadas`.

La línea **Código sugerido** aparece solo en el ejemplo de Alta para abreviar, pero aplica a cualquier
prioridad cuando el arreglo es de código.

## Principios para buenos hallazgos

- **Sé específico.** Señala el elemento real (p. ej. el botón "Guardar" de la esquina inferior derecha)
  y el problema real.
- **Justifica siempre.** Cada hallazgo dice *por qué* importa, ligado a un criterio WCAG o heurística
  con nombre. Eso lo hace didáctico y no una opinión.
- **Cita con precisión.** Verifica número y nombre del criterio. Trampa habitual: `type="email"` no es
  WCAG 1.3.5; ese criterio trata de los tokens `autocomplete`. Atribuye `autocomplete="email"` a 1.3.5.
- **Incluye el snippet de corrección** cuando el arreglo sea de código, mínimo y copiable, usando
  tokens del sistema de diseño (`var(--brand-600)`, `rem`) en lugar de valores fijos.
- **No inventes.** Lo que no se puede verificar con las entradas se pide o se marca "no verificado".
- **Respeta las convenciones.** Un patrón documentado del sistema de diseño no es un defecto por
  diferir de un estándar genérico; confírmalo antes de señalarlo.
- **Tono constructivo.** Revisión entre colegas: claro con los problemas, siempre con su solución.
