# Patrones UX

## Loading — `wpBlockUI`

`BlockUIDirective` (`@app/core/directives/block-ui.directive`): overlay con spinner sobre el contenedor.
Inputs: `block`, `message`, `overlayColor`, `backgroundColor`, `spinnerColor`, `centerY` (por defecto `true`).

```html
<div wpBlockUI
  [block]="dataLoading() || isLoading()"
  [overlayColor]="'rgba(0,0,0,0.25)'"
  [message]="isLoading()
    ? ('COMMONS.MESSAGES.SAVING_DATA' | translate)
    : ('COMMONS.MESSAGES.LOADING_DATA' | translate)">
  …
</div>
```

- Mensaje distinto para cargar (`LOADING_DATA`) y guardar (`SAVING_DATA`).
- Las listas con `wp-table-common` ya muestran su propio loading con `[loading]="loading()"`; no envuelvas la tabla en otro overlay.
- Botón de submit deshabilitado mientras `actionsLoading()` o el formulario sea inválido.

## Notificaciones — ngx-toastr

```typescript
this.toastr.success(this.translate.instant('CARRIER.MESSAGES.DELETE_SUCCESS'));
this.toastr.error(message);
```

- Siempre con texto traducido. Nunca `alert()`.
- Errores HTTP: `ApiErrorService.extract(err, fallbackKey?)` (`@app/core/services/api-error.service`) devuelve el
  mensaje del backend (`detail`) o uno genérico por status. Úsalo en lugar de leer `err.error.detail` a mano.
- Errores del store: un `effect` que compare con el error anterior para no repetir el toast
  (ver `errorEffect` en `carrier.component.ts`).

## Éxito de acciones del store

El store no devuelve un callback; el componente deduce el resultado observando `actionsLoading`:

```typescript
private readonly pendingDelete = signal(false);
private wasDeleting = false;

private deleteResultEffect = effect(() => {
  if (!this.pendingDelete()) return;
  if (this.actionsLoading()) { this.wasDeleting = true; return; }
  if (!this.wasDeleting) return;
  this.wasDeleting = false;
  this.pendingDelete.set(false);
  if (!this.error()) this.toastr.success(this.translate.instant('CARRIER.MESSAGES.DELETE_SUCCESS'));
});
```

Nunca `setTimeout` para "esperar" al store.

## Confirmaciones — SweetAlert2

Solo para acciones destructivas o irreversibles (eliminar, anular, enviar al SRI…).

```typescript
Swal.fire({
  title: this.translate.instant('COMMONS.CONFIRM.ARE_YOU_SURE'),
  text: this.translate.instant('CARRIER.CONFIRM.DELETE', { name }),
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: this.translate.instant('COMMONS.BUTTONS.YES_DELETE'),
  cancelButtonText: this.translate.instant('COMMONS.BUTTONS.CANCEL'),
  buttonsStyling: false,
  customClass: { popup: 'wp-swal', confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
}).then(r => { if (r.isConfirmed) this.store.delete(id); });
```

- **Código nuevo**: tema `.wp-swal` con botones Bootstrap (como `SWAL_THEME` en `generate-documents.component.ts`),
  no `confirmButtonColor` hex. Muchas pantallas aún usan `confirmButtonColor: '#d33'`: es deuda, no la copies.
- Si el borrado tiene efectos colaterales, dilo en el texto (p. ej. contraparte que también es cliente).

## Formularios

- Etiqueta con `for`/`id`; obligatorio marcado con `<span class="req">*</span>` y leyenda `.req-legend` al inicio.
- Error visible solo tras `dirty || touched`: `[class.is-invalid]` + `<div class="invalid-feedback">`.
- **Un mensaje a la vez**, del más básico al más específico, con `@if / @else if` (ver `edit-carrier.component.html`).
- `autocomplete` explícito (`off` en identificadores, el valor estándar en email/teléfono).
- `trim` en `blur` para identificadores; normaliza (mayúsculas, sin guiones) al guardar, no al teclear.
- `maxlength` alineado con la columna de BD (constantes en el componente).

## Estados de pantalla

- Vacío: mensaje informativo (`.empty` o el de la tabla), nunca una tabla en blanco sin texto.
- Error de carga: aviso (`.note--err` / `alert-danger`) con opción de reintentar cuando aplique.
- Avisos contextuales dentro de formularios: `alert alert-info|warning` con icono `aria-hidden="true"` y `role="status"`/`"alert"`.
