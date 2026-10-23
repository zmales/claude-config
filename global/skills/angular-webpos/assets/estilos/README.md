# Sistema de diseño WebPOS — archivos fuente

Copia oficial de la paleta y las clases globales de los portales Angular de WebPOS.

| Archivo | Qué es |
|---|---|
| `_tokens.scss` | Custom properties CSS en `:root` (color, espaciado, radios, sombras, tipografía). **Fuente de verdad.** |
| `_variables.scss` | Espejo en variables Sass (`$primary`, `$gray-*`…) para funciones Sass (`rgba($x, .1)`). No emite CSS. Usa `bootstrap/scss/functions`. |
| `_design-system.scss` | Clases globales (`.pane`, `.block`, `.status`, `.note`, `.chip`, `.req`, `.wp-swal`…) y remapeo de Bootstrap. |

## Incorporarlos a un proyecto nuevo

1. Copia los tres archivos a `src/styles/` del proyecto.
2. En `angular.json` (`build.options` y `test.options` si aplica):
   `"stylePreprocessorOptions": { "includePaths": ["src/styles", "node_modules"] }`.
3. En `src/styles.scss`, en este orden (el orden fija la cascada; no uses `!important` para corregirla):

   ```scss
   @use 'bootstrap';        // compilación única de Bootstrap 5 (p. ej. un _bootstrap.scss propio)
   @use 'tokens';
   @use 'design-system';
   @use 'responsive';       // capa móvil propia del proyecto, si existe; siempre la última
   ```

4. Instala `bootstrap` y `bootstrap-icons`. SweetAlert2 usa `customClass.popup: 'wp-swal'` + `buttonsStyling: false`.

## Mantenimiento

- Cambia un color **primero en `_tokens.scss`** y replica el valor en `_variables.scss`.
- Si un proyecto ajusta estos archivos, sube el cambio aquí para que el resto lo herede.
- Estos son los únicos archivos donde se permiten colores literales; `check-styles.js` los excluye.
