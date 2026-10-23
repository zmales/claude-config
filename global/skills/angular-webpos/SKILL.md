---
name: wp-frontend
description: Estándares y patrones REALES del portal Angular 20 WPPORTALFEEC — componentes standalone con wp-portlet, Signal Store con withEntityCrud, servicios BaseService, i18n con ngx-translate (archivos .es.ts/.en.ts), sistema de diseño (_tokens.scss / _design-system.scss), permisos con PermissionService, UX (wpBlockUI, toastr, SweetAlert2), seguridad OIDC/tokens, rendimiento, accesibilidad, TypeScript y tests Jest. Úsala siempre que crees, modifiques o revises un componente, pantalla, modal, store, servicio, traducción o estilo de este repo, aunque no se mencionen estas palabras.
---

# wp-frontend — Portal WPPORTALFEEC

Esta skill es un **índice**. No leas todas las referencias: lee solo las que toque la tarea.

## Regla de oro

**El código del repo manda sobre cualquier regla genérica.** Antes de escribir, abre el
componente vecino más parecido y copia su forma. Referencia canónica de CRUD:
`src/app/views/components/admin/carrier/` (lista + modal de edición) con
`src/app/store/signal-store/carrier/carrier.store.ts`.

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

1. Localiza la feature (`admin`, `CompanyAdmin`, `Documents`, `account`…) y el componente vecino más parecido.
2. Modelo + servicio en `src/app/store/<feature>/<entidad>/` → `estado.md`.
3. Store en `src/app/store/signal-store/<entidad>/<entidad>.store.ts` con `withEntityCrud` → `estado.md`.
4. Componente lista + modal de edición → `componentes.md`, `ux.md`, `permisos.md`.
5. Traducciones `.es.ts` **y** `.en.ts` y registro en `es.ts`/`en.ts` → `i18n.md`.
6. Ruta con `loadComponent` en el `*.routes.ts` de la feature.
7. Test en `test/views/components/<ruta espejo>/` → `testing.md`.

## Validación obligatoria antes de terminar

Ejecuta desde la raíz del repo y corrige lo que reporten sobre los archivos que tocaste:

```bash
node "$HOME/.claude/skills/wp-frontend/scripts/check-i18n.js"
node "$HOME/.claude/skills/wp-frontend/scripts/check-styles.js" <archivos o carpetas tocados>
```

- `check-i18n.js` compara cada `*.es.ts` con su `*.en.ts` y lista claves faltantes en cualquiera de los dos.
- `check-styles.js` busca colores hex/rgb hardcodeados, `!important`, `outline: none` sin `:focus-visible`, estilos inline y `*ngIf`/`*ngFor`.
  Por defecto revisa `src/app`; pasa rutas para acotar.

Si cambiaste lógica, corre también `npx jest <ruta-del-spec>` y, para cambios grandes, `npx ng build`.
