# Rendimiento y accesibilidad

## Rendimiento

- **OnPush** en todo componente y estado en signals (ver `componentes.md`).
- **Rutas lazy**: `loadComponent` / `loadChildren` en los `*.routes.ts`. Nunca importes una pantalla de forma eager en las rutas.
- **`@for` siempre con `track`** por una clave estable (`track item.id`), no por índice salvo listas estáticas.
- Derivados en `computed()`; nada de llamadas a métodos costosos dentro de la plantilla.
- Librerías pesadas (Excel, PDF, gráficos): impórtalas de forma dinámica (`await import('…')`) dentro de la acción que las usa.
- `@defer (on viewport)` con `@placeholder` para bloques pesados debajo del pliegue (gráficos, visores). Opcional,
  pero considéralo en pantallas nuevas con contenido pesado.
- Los stores son singletons: aprovecha `loadAll()` con caché; usa `forceLoadAll()` / `resetStore()` solo cuando hay que refrescar.
- Respeta los budgets de `angular.json`; si `ng build` los excede, investiga antes de subirlos.

## Accesibilidad (WCAG 2.1 AA)

- **Encabezados**: un `h1` por pantalla (`.pane__title`) y jerarquía sin saltos.
- **Botones solo-icono** con `aria-label` traducido (`[attr.aria-label]="'…' | translate"`); icono con `aria-hidden="true"`.
- **Botones** siempre con `type` explícito (`type="button"` salvo el submit real).
- **Formularios**: `label for` ↔ `id`, `autocomplete` explícito, errores con `.invalid-feedback`, `aria-invalid` y
  `aria-describedby` apuntando al mensaje.
- **Contenido dinámico** (avisos, resultados de validación): `role="status"` o `role="alert"`.
- **Teclado**: todo lo clicable es `<button>` o `<a href>`, no `div (click)`. Comprueba en el proyecto si `wp-modal`
  gestiona foco y Escape antes de depender de ello.
- **Foco visible**: lo da el `:focus-visible` global; no lo anules (ver `estilos.md`).
- **Contraste**: usa los tokens de texto (`--text`, `--text-muted`, `--text-subtle`), ya calibrados para AA.
- **Imágenes** con `alt` descriptivo (o `alt=""` si son decorativas) y `width`/`height` para evitar saltos de layout.

Para una auditoría UX/accesibilidad completa de una pantalla, usa la skill `ux-review` o el agente de revisión UX.
