# Componentes

Plantilla: `assets/plantilla-crud/component/` (lista `wp-item` + modal `wp-edit-item`).

## Ubicación y nombres

```
src/app/views/components/<feature>/<entidad>/
├── <entidad>.component.{ts,html}                        ← lista (smart)
└── edit-<entidad>/edit-<entidad>.component.{ts,html}    ← modal de alta/edición
```

- Las features reales del proyecto están en su skill de contexto.
- Selector: `wp-<entidad>` / `wp-edit-<entidad>`.
- Ruta lazy en el `*.routes.ts` de la feature:
  `loadComponent: () => import('./item/item.component').then(m => m.ItemComponent)`.
- Componentes compartidos en `src/app/shared/general/` (tabla, modal, exportar, etc.); reutilízalos antes de crear otro.
- `.scss` solo si hace falta; si existe, solo `var(--token)` (ver `estilos.md`).

## Plantilla de componente

```typescript
@Component({
  selector: 'wp-item',
  templateUrl: './item.component.html',
  standalone: true,
  imports: [TableCommonComponent, ExportBtnComponent, PortletComponent, PortletHeaderComponent,
            PortletBodyComponent, TranslateModule, EditItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemComponent {
  //#region inject
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly apiError = inject(ApiErrorService);
  readonly permissionService = inject(PermissionService);   // público: lo usa la plantilla
  readonly itemStore = inject(ItemStore);
  //#endregion

  readonly resource = 'items';                               // recurso de permisos
  readonly loading = this.itemStore.isLoading;
  readonly displayList = computed(() => this.itemStore.selectAll().map(/* valores legibles */));

  constructor() {
    this.itemStore.resetStore();
    this.itemStore.loadByCompany(this.companyLicCod);
  }
}
```

Reglas:
- **Standalone + `ChangeDetectionStrategy.OnPush`** siempre.
- **`inject()`** en componentes. (Los servicios que extienden `BaseService` sí usan constructor: ver `estado.md`.)
- **Control de flujo nuevo** `@if` / `@for (… ; track …)` / `@else if`. Nunca `*ngIf` / `*ngFor`.
- **`input()` / `input.required()` / `output()`** en código nuevo. No añadas `@Input`/`@Output`; no migres los legados
  salvo que la tarea lo pida.
- Estado local de UI con `signal()`; derivados con `computed()` (nunca cálculos en la plantilla).
- Reacciones a cambios del store con `effect()` declarado como campo (`private readonly xEffect = effect(() => …)`).
- Agrupa el cuerpo de la clase con `//#region`.
- Alias de import `@app/...`.
- Sin lógica de negocio pesada en el componente: va al store o al servicio.

## Estructura de pantalla (portlet)

Toda pantalla usa `wp-portlet`, que emite las clases `.pane` del sistema de diseño:

```html
<wp-portlet>
  <wp-portlet-header>
    <div wpPortletTitle>
      <h1 class="pane__title">{{ 'ITEM.TITLE' | translate }}</h1>
      <p class="pane__desc">{{ 'ITEM.DESC' | translate }}</p>
    </div>
    <ng-container wpPortletTools>
      @if (permissionService.canWrite(resource)) {
        <button type="button" class="btn btn-primary me-2" (click)="add()">
          <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>{{ 'ITEM.BTN.ADD' | translate }}
        </button>
      }
      @if (permissionService.canExport(resource)) {
        <wp-export-btn [data]="displayList()" filename="items" [columns]="exportColumns" />
      }
    </ng-container>
  </wp-portlet-header>
  <wp-portlet-body>
    <wp-table-common [items]="displayList()" [loading]="loading()" [configColumns]="tableConfig"
      [entityEditPermission]="resource" [entityDeletePermission]="resource"
      (onEvent1)="onTableAction($event)" />
  </wp-portlet-body>
</wp-portlet>

@if (showModal()) {
  <wp-edit-item [itemId]="selectedId()" (saved)="closeModal()" (cancelled)="closeModal()" />
}
```

## Tabla (`wp-table-common`) y exportación

- Columnas en un array `configColumns` construido una vez con `name`, `label` (vía `translate.instant`),
  `translate` (la clave), `type` (`'string'`, `'customActions'`, …), `visible`, `isSortable`, `isSearchable`.
- Acciones por fila: columna `type: 'customActions'` con `data: [{ name, icon, tooltip, optionClick }]`; el evento
  llega por `(onEvent1)` como `{ event: { optionClick }, data: entidad }` y se despacha con un mapa
  `Record<string, (e) => void>`. Tipa el evento con una interfaz local, no con `any`.
- Valores transformados (estado, tipo, fechas) en un `computed()` (`displayList`), no en la plantilla.
- `exportColumns: ExportColumn[]` con `label: this.translate.instant('ITEM.TABLE.X')`. **Nunca etiquetas literales.**

## Modal de edición

- `<wp-modal [title]="title()" (closed)="onClosed()">` (`@app/shared/general/modal/wp-modal.component`); botones en
  `<div wpModalFooter>`. `wp-modal` no deshabilita su "X": ignora el cierre mientras se guarda.
- `itemId = input<number | string | null>(null)` (null = alta), `saved = output<void>()`, `cancelled = output<void>()`.
  El padre lo monta con `@if (showModal())`.
- Formulario reactivo tipado (`fb.nonNullable.group`). Validadores compartidos en `src/app/shared/validators/`
  (p. ej. `notBlankValidator`, que devuelve `required`). Longitudes máximas como constantes que reflejan la columna de BD.
- Formularios, loading y feedback: ver `ux.md`.

## TypeScript y documentación

- `strict` activo. En código nuevo evita `any` (usa el modelo, `unknown` + type guard o un tipo local). No propagues
  el `any` heredado a APIs nuevas.
- Tipa los retornos de métodos públicos y de servicios (`Observable<ItemModel[]>`).
- Nombres en inglés y `camelCase`/`PascalCase`; booleanos como condición (`isLoading`, `hasRole`, `canEdit`); sin abreviaturas.
- Constantes de módulo en `UPPER_SNAKE_CASE`. Para catálogos nuevos prefiere objetos `as const` + tipo derivado.
- **JSDoc en español** que explique el *porqué* (regla de negocio, endpoint, decisión), no el *qué*. Documenta
  métodos públicos de stores/servicios y los `effect` no obvios.
- Optional chaining y `??` para nulos; evita `!` sin justificar.

## Checklist

- [ ] Standalone + OnPush, `inject()`, `input()/output()`, `@if/@for` con `track`
- [ ] Pantalla dentro de `wp-portlet` con `pane__title` / `pane__desc`
- [ ] Textos con `| translate`, incluidas columnas de tabla y exportación (ver `i18n.md`)
- [ ] Acciones protegidas con `permissionService.canX(resource)` (ver `permisos.md`)
- [ ] Ruta lazy registrada
