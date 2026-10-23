---
name: angular-webpos
description: Estándares Angular de la empresa WebPOS para cualquier proyecto frontend — arquitectura (BaseService, NgRx Signal Store con withEntityCrud), componentes standalone (wp-portlet, wp-modal, wp-table-common), sistema de diseño y colores (_tokens.scss / _design-system.scss), i18n con ngx-translate (.es.ts/.en.ts), permisos (PermissionService), UX (wpBlockUI, toastr, SweetAlert2), accesibilidad, seguridad OIDC y testing con Jest. Incluye plantilla CRUD y scripts de validación. Uso interno - la precargan los agentes frontend-angular, code-review y design-fix.
user-invocable: false
---

# angular-webpos — Estándares Angular de WebPOS

Esta skill es un **índice**. No leas todas las referencias: lee solo las que toque la tarea.

## Orden de autoridad

1. **El código del repo** en el que trabajas (lo que existe y compila manda).
2. **La skill de contexto del proyecto** (`.claude/skills/*-contexto/` del repo, si existe): rutas reales,
   recursos de permiso, comandos y la **deuda conocida que no se debe copiar**.
3. **Esta skill** (norma de empresa).
4. Conocimiento general de Angular.

Si el repo contradice esta skill solo por deuda listada en el contexto del proyecto, sigue esta skill.

## Punto de partida para código nuevo

Usa las plantillas de `assets/plantilla-crud/` (lista + modal + store + servicio + i18n + spec; ver su README).
Mira código del repo solo para **encajar en su estructura** (carpetas, alias, componentes compartidos), sin copiar la
deuda listada en el contexto del proyecto.

Paleta y clases oficiales: `assets/estilos/` (`_tokens.scss`, `_variables.scss`, `_design-system.scss`).

## Qué leer según la tarea

| Si la tarea toca… | Lee |
|---|---|
| Crear/modificar un componente, pantalla o modal | `references/componentes.md` |
| Store, servicio HTTP, modelo, carga de datos | `references/estado.md` |
| SCSS, clases, colores, espaciado, layout | `references/estilos.md` |
| Cualquier texto visible al usuario | `references/i18n.md` |
| Loading, notificaciones, confirmaciones, formularios, errores | `references/ux.md` |
| Botones/acciones según rol o permiso, guards | `references/permisos.md` |
| Tests | `references/testing.md` |
| Login/OIDC, tokens, interceptor, sesión, config runtime, datos sensibles | `references/seguridad.md` |
| Rendimiento, lazy loading, `@defer`, accesibilidad (aria, teclado, contraste) | `references/rendimiento-a11y.md` |
| TypeScript, nombres, JSDoc | sección final de `references/componentes.md` |

Una pantalla nueva típica toca: componentes + estado + i18n + ux + permisos.

## Flujo para una pantalla nueva

1. Localiza la feature y la ruta donde va (contexto del proyecto).
2. Copia la plantilla de `assets/plantilla-crud/` y renombra según su README.
3. Modelo + servicio en `src/app/store/<feature>/<entidad>/` → `estado.md`.
4. Store en `src/app/store/signal-store/<entidad>/<entidad>.store.ts` con `withEntityCrud` → `estado.md`.
5. Componente lista + modal de edición → `componentes.md`, `ux.md`, `permisos.md`.
6. Traducciones `.es.ts` **y** `.en.ts` y registro en `es.ts`/`en.ts` → `i18n.md`.
7. Ruta con `loadComponent` en el `*.routes.ts` de la feature.
8. Test en `test/<ruta espejo de src/app>/` → `testing.md`.

## Validación obligatoria antes de terminar

Ejecuta desde la raíz del repo y corrige lo que reporten sobre los archivos que tocaste:

```bash
node "$HOME/.claude/skills/angular-webpos/scripts/check-i18n.js"            # [carpeta de idiomas]
node "$HOME/.claude/skills/angular-webpos/scripts/check-styles.js" <archivos o carpetas tocados>
```

- `check-i18n.js`: compara cada `*.es.ts` con su `*.en.ts` (claves faltantes, valores vacíos, archivos sin registrar)
  y detecta un archivo de un idioma que importa el del otro (`en.ts` → `x.es`). El argumento opcional es la
  **carpeta** de idiomas (por defecto `src/app/_config/lang`); con 0 pares sale con error.
- `check-styles.js`: colores literales en valores de propiedades SCSS, `!important`, `outline: none` sin
  `:focus-visible`, `style="…"`, `[style.x]`/`[ngStyle]`, colores literales en bindings de plantilla (también en
  `template:` inline), `*ngIf`/`*ngFor`, y
  colores literales de SweetAlert (`confirmButtonColor`/`cancelButtonColor`) en `.ts`. Omite `_tokens`,
  `_variables` y `_design-system`. Sin rutas revisa todo `src/app` (incluye deuda previa): pasa rutas para acotar.

Si cambiaste lógica, corre también `npx jest <ruta-del-spec>` y, para cambios grandes, `npx ng build`.
