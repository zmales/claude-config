# Patrones UX

## Loading — `wpBlockUI`

`BlockUIDirective` (`@app/core/directives/block-ui.directive`): overlay con spinner sobre el contenedor.
Inputs: `block`, `message`, `centerY` (por defecto `true`) y colores opcionales.

```html
<div wpBlockUI
  [block]="dataLoading() || saving()"
  [message]="saving()
    ? ('COMMONS.MESSAGES.SAVING_DATA' | translate)
    : ('COMMONS.MESSAGES.LOADING_DATA' | translate)">
  …
</div>
```

- **No pases colores** (`overlayColor`, `backgroundColor`, `spinnerColor`): usa los valores por defecto de la
  directiva. Si de verdad hace falta otro, pásalo como token (`'var(--…)'`), nunca un literal `rgba(…)`/`#…`.
- Mensaje distinto para cargar (`LOADING_DATA`) y guardar (`SAVING_DATA`).
- Las listas con `wp-table-common` ya muestran su propio loading con `[loading]="loading()"`; no envuelvas la tabla en otro overlay.
- Botón de submit deshabilitado mientras `actionsLoading()` o el formulario sea inválido, con spinner inline:
  `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>` + texto `SAVING`/`UPDATING`.

## Notificaciones — ngx-toastr

```typescript
this.toastr.success(this.translate.instant('ITEM.MESSAGES.DELETE_SUCCESS'));
this.toastr.error(this.apiError.extract(err, 'COMMONS.MESSAGES.OPERATION_ERROR'));
```

- Siempre con texto traducido. Nunca `alert()` / `window.confirm()`.
- La configuración (posición, duración) es global en `app.config.ts` (`provideToastr`); no la cambies por llamada.
- Errores HTTP: `ApiErrorService.extract(err, fallbackKey?)` (`@app/core/services/api-error.service`) devuelve el
  mensaje traducido del backend (`errorCode`, validaciones, `detail`) o uno genérico por status. **Nunca leas
  `err.error.detail` ni `err.message` a mano.**
- Errores del store: un `effect` que compare con el error anterior para no repetir el toast (ver la plantilla).

## Éxito de acciones del store

El store no devuelve un callback; el componente deduce el resultado observando `actionsLoading`:

```typescript
private readonly pendingDelete = signal(false);
private wasDeleting = false;

private readonly deleteResultEffect = effect(() => {
  if (!this.pendingDelete()) return;
  if (this.actionsLoading()) { this.wasDeleting = true; return; }
  if (!this.wasDeleting) return;
  this.wasDeleting = false;
  this.pendingDelete.set(false);
  if (!this.error()) this.toastr.success(this.translate.instant('ITEM.MESSAGES.DELETE_SUCCESS'));
});
```

Para altas, observa `lastCreatedId` (y llama `clearLastCreatedId()`). Nunca `setTimeout` para "esperar" al store.

## Confirmaciones — SweetAlert2

Solo para acciones destructivas o irreversibles (eliminar, anular, enviar a un organismo externo…).

```typescript
const SWAL_THEME = {
  buttonsStyling: false,
  customClass: { popup: 'wp-swal', confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
} as const;

Swal.fire({
  ...SWAL_THEME,
  title: this.translate.instant('COMMONS.CONFIRM.ARE_YOU_SURE'),
  text: this.translate.instant('ITEM.CONFIRM.DELETE', { name }),
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: this.translate.instant('COMMONS.BUTTONS.YES_DELETE'),
  cancelButtonText: this.translate.instant('COMMONS.BUTTONS.CANCEL'),
}).then(r => { if (r.isConfirmed) this.store.delete(id); });
```

- Los colores salen de los tokens a través de `.wp-swal` y `.btn-*`. **Nunca** `confirmButtonColor`/`cancelButtonColor`
  con hex (lo detecta `check-styles.js`).
- Si el borrado tiene efectos colaterales, dilo en el texto.

## Formularios

- Etiqueta con `for`/`id`; obligatorio marcado con `<span class="req" aria-hidden="true">*</span>` (clase del sistema
  de diseño) y leyenda al inicio: `<p class="req-legend"><span class="req">*</span>{{ '…REQUIRED_LEGEND' | translate }}</p>`.
  No crees clases locales tipo `.required-asterisk`.
- Error visible solo tras `dirty || touched`: `[class.is-invalid]` + `<div class="invalid-feedback">`, con
  `aria-invalid` y `aria-describedby` al mensaje.
- **Un mensaje a la vez**, del más básico al más específico, con `@if / @else if`.
- `autocomplete` explícito (`off` en identificadores, el valor estándar en email/teléfono/dirección).
- `trim` en `blur` para identificadores; normaliza (mayúsculas, sin guiones) al guardar, no al teclear.
- `maxlength` alineado con la columna de BD (constantes).
- Envío inválido: `markAllAsTouched()` + `toastr.warning(COMMONS.MESSAGES.FIELDS_INCOMPLETE)`.

## Estados de pantalla

- Vacío: mensaje informativo (`.empty` o el de la tabla), nunca una tabla en blanco sin texto.
- Error de carga: aviso (`.note--err` / `alert-danger`) con opción de reintentar cuando aplique.
- Avisos contextuales dentro de formularios: `alert alert-info|warning` con icono `aria-hidden="true"` y `role="status"`/`"alert"`.
