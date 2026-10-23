# Estilos y sistema de diseño

Los portales WebPOS comparten un sistema de diseño propio. La copia oficial está en `assets/estilos/` de esta skill
(ver su README para incorporarlo a un proyecto nuevo). En el proyecto vive en `src/styles/` y se carga una sola vez
desde `src/styles.scss`:

| Archivo | Qué contiene |
|---|---|
| `_tokens.scss` | Custom properties CSS (`:root`). **Fuente de verdad** de color, espaciado, radios, sombras, tipografía. |
| `_variables.scss` | Espejo en variables Sass (`$primary`, `$danger`…) para funciones Sass como `rgba($x, .1)`. |
| `_design-system.scss` | Clases globales (`.pane`, `.block`, `.status`, `.note`, `.chip`, `.req`, `.wp-swal`…) y remapeo de Bootstrap. |
| `_responsive.scss` (si existe) | Capa móvil del proyecto. Se carga la última. |

Bootstrap 5 + Bootstrap Icons (`bi bi-*`). **No introduzcas Angular Material ni PrimeNG** en pantallas nuevas aunque
estén instalados en un proyecto.

## Orden de preferencia al estilar

1. **Clase existente** de Bootstrap o del sistema de diseño (no escribas SCSS).
2. **Token** `var(--…)` en el SCSS del componente.
3. Variable Sass (`@use 'variables' as *;`, resuelta por `includePaths: src/styles`) solo si necesitas una función
   Sass (p. ej. transparencias: `rgba($primary, .12)`; no hay tokens `--*-rgb`).
4. Nunca un valor literal (`#dc3545`, `13px`, `rgba(0,0,0,.2)`).

## Tokens principales

- Marca: `--brand-50 … --brand-950` (primario = `--brand-600`; `--bs-primary` apunta ahí).
- Neutros: `--n-0 … --n-900`.
- Semánticos: `--ok-*`, `--warn-*`, `--err-*` (p. ej. `--err-600` es el rojo de error/obligatorio).
- Texto: `--text-strong`, `--text`, `--text-muted`, `--text-subtle`, `--text-placeholder`.
- Bordes: `--border-control`, `--border-divider`, `--border-strong`.
- Radios: `--r-sm` (4) `--r-md` (6) `--r-lg` (8) `--r-pill`.
- Sombras: `--sh-xs`, `--sh-sm`, `--sh-md`, `--sh-lg`.
- Espaciado base 4: `--s-1` (4) `--s-2` (8) `--s-3` (12) `--s-4` (16) `--s-5` (20) `--s-6` (24) `--s-8` (32) `--s-10` (40).
- Tipografía: `--fs-micro` (11) `--fs-xs` (12) `--fs-sm` (13) `--fs-base` (14) `--fs-md` (16) … `--fs-3xl` (28).
- Controles: `--h-control` (34), `--h-control-sm`, `--h-control-lg`.

Los tokens de texto ya están ajustados para contraste AA; no elijas grises "a ojo". Ante la duda, abre `_tokens.scss`.

## Clases del sistema de diseño más usadas

- Contenedor de pantalla: `.pane`, `.pane__head`, `.pane__title`, `.pane__desc`, `.pane__actions`, `.pane__body`
  (los emite `wp-portlet`; ver `componentes.md`). Secciones internas: `.block`, `.block__head`, `.subcard`.
- Tipografía: `.t-card`, `.t-eyebrow`, `.t-meta`, `.t-label`, `.tnum`/`.mono` (números alineados).
- Estado: `.status` + `--ok|--err|--warn|--neutral`; avisos: `.note` + `--info|--ok|--warn|--err`; etiquetas: `.chip`, `.tag`.
- Formularios: `.req` (asterisco de obligatorio), `.req-legend`, `.field`, `.fieldset`, `.hint`, `.g-form`.
- Filtros: `.filters__row`, `.filters__field`, `.filters__actions`. Vacío: `.empty`. Botones icono: `.icon-btn`.
- SweetAlert: `customClass.popup: 'wp-swal'` + `buttonsStyling: false` (ver `ux.md`).

## Reglas

- **Nada de colores literales** en SCSS de componentes ni en `.ts` (Swal, directivas). Ej.: el asterisco de obligatorio
  es `.req`, no un `.required-asterisk { color: #dc3545 }` local.
- **Sin `!important`** (la capa responsive y el design system ya ganan por orden de carga).
- **Foco**: hay un `:focus-visible` global. Nunca `outline: none` sin una alternativa `:focus-visible`.
- **Sin estilos inline** (`style="…"`, `[ngStyle]`, `[style.x]`) en plantillas; usa clases utilitarias de Bootstrap
  (`d-flex`, `gap-2`, `mb-3`, `text-muted`…) o `[class.x]`. Excepción: un valor calculado (ancho %), comentado.
- Móvil: si una pantalla necesita ajuste en teléfono, usa `@media (max-width: 575.98px)` (corte `$bp-phone`).
- Clases propias del componente: prefijo corto del componente + BEM ligero (`.item-code-input`,
  `.filters__field--wide`). Evita nombres genéricos (`.title`, `.box`).
- Iconos decorativos con `aria-hidden="true"`.
- Si cambias la paleta, cámbiala en `_tokens.scss` (y su espejo en `_variables.scss`) y súbela a `assets/estilos/`.

La validación automática está en `scripts/check-styles.js`.
