# Estilos y sistema de diseño

El portal tiene un sistema de diseño propio, cargado una sola vez desde `src/styles.scss`:

| Archivo | Qué contiene |
|---|---|
| `src/styles/_tokens.scss` | Custom properties CSS (`:root`). **Fuente de verdad** de color, espaciado, radios, sombras, tipografía. |
| `src/styles/_variables.scss` | Espejo en variables Sass (`$primary`, `$danger`…) para funciones como `rgba()`. Sincronizado con tokens. |
| `src/styles/_design-system.scss` | Clases globales (`.pane`, `.block`, `.status`, `.note`, `.chip`, `.req`…) y remapeo de Bootstrap. |
| `src/styles/_responsive.scss` | Capa móvil (`$bp-phone: 575.98px`). Se carga la última. |

Bootstrap 5 + Bootstrap Icons (`bi bi-*`). Angular Material y PrimeNG existen en partes legadas; no los introduzcas en pantallas nuevas.

## Orden de preferencia al estilar

1. **Clase existente** de Bootstrap o del sistema de diseño (no escribas SCSS).
2. **Token** `var(--…)` en el SCSS del componente.
3. Variable Sass (`@use 'variables';`, ruta resuelta por `includePaths: src/styles`) solo si necesitas una función Sass.
4. Nunca un valor literal (`#dc3545`, `13px`, `rgba(0,0,0,.2)`).

## Tokens principales

- Marca: `--brand-50 … --brand-950` (primario = `--brand-600`; `--bs-primary` apunta ahí).
- Neutros: `--n-0 … --n-900`.
- Semánticos: `--ok-50/200/600/700`, `--warn-50/200/400/600`, `--err-50/200/600/700`.
- Texto: `--text-strong`, `--text`, `--text-muted`, `--text-subtle`, `--text-placeholder`.
- Bordes: `--border-control`, `--border-divider`, `--border-strong`.
- Radios: `--r-sm` (4) `--r-md` (6) `--r-lg` (8) `--r-pill`.
- Sombras: `--sh-xs`, `--sh-sm`, `--sh-md`, `--sh-lg`.
- Espaciado base 4: `--s-1` (4) `--s-2` (8) `--s-3` (12) `--s-4` (16) `--s-5` (20) `--s-6` (24) `--s-8` (32) `--s-10` (40).
- Tipografía: `--fs-micro` (11) `--fs-xs` (12) `--fs-sm` (13) `--fs-base` (14) `--fs-md` (16) … `--fs-3xl` (28).
- Controles: `--h-control` (34), `--h-control-sm`, `--h-control-lg`.

Los tokens de texto ya están ajustados para contraste AA; no elijas grises "a ojo".

## Clases del sistema de diseño más usadas

- Contenedor de pantalla: `.pane`, `.pane__head`, `.pane__title`, `.pane__desc`, `.pane__actions`, `.pane__body`
  (los emite `wp-portlet`; ver `componentes.md`). Secciones internas: `.block`, `.block__head`, `.subcard`.
- Tipografía: `.t-card`, `.t-eyebrow`, `.t-meta`, `.t-label`, `.tnum`/`.mono` (números alineados).
- Estado: `.status` + `--ok|--err|--warn|--neutral`; avisos: `.note` + `--info|--ok|--warn|--err`; etiquetas: `.chip`, `.tag`.
- Formularios: `.req` (asterisco de obligatorio), `.req-legend`, `.field`, `.fieldset`, `.hint`, `.g-form`.
- Filtros: `.filters__row`, `.filters__field`, `.filters__actions`. Vacío: `.empty`. Botones icono: `.icon-btn`.
- SweetAlert con estilo propio: `customClass` con `.wp-swal`.

## Reglas

- **Nada de colores literales** en SCSS de componentes. Ej.: el asterisco de obligatorio es `.req`, no un `.required-asterisk { color: #dc3545 }` local.
- **Sin `!important`** (la capa responsive y el design system ya ganan por orden de carga).
- **Foco**: hay un `:focus-visible` global. Nunca `outline: none` sin una alternativa `:focus-visible`.
- **Sin estilos inline** (`style="…"`) en plantillas; usa clases utilitarias de Bootstrap (`d-flex`, `gap-2`, `mb-3`, `text-muted`…).
- Móvil: si una pantalla necesita ajuste en teléfono, usa `@media (max-width: 575.98px)` (mismo corte que `$bp-phone`).
- Nombres de clases propias del componente: prefijo corto del componente + BEM ligero (`.carrier-plate-input`,
  `.filters__field--wide`). No hace falta BEM estricto en todo; sí evita nombres genéricos (`.title`, `.box`).
- Iconos decorativos con `aria-hidden="true"`.

La validación automática está en `scripts/check-styles.js`.
