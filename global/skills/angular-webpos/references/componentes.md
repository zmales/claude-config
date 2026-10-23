# Componentes

Referencia canónica: `src/app/views/components/admin/carrier/`.

## Ubicación y nombres

```
src/app/views/components/<feature>/<entidad>/
├── <entidad>.component.{ts,html,scss}            ← lista (smart)
└── edit-<entidad>/edit-<entidad>.component.{ts,html,scss}   ← modal de alta/edición
```

- Features existentes: `admin`, `CompanyAdmin`, `Documents`, `account`, `configs`, `init`, `plans`, `register`, `legal`, `site`.
- Selector: `wp-<entidad>` / `wp-edit-<entidad>`.
- Ruta lazy en el `*.routes.ts` de la feature:
  `loadComponent: () => import('./carrier/carrier.component').then(m => m.CarrierComponent)`.
- Componentes compartidos en `src/app/shared/general/` (tabla, modal, export, etc.); reutilízalos antes de crear otro.

## Plantilla de componente

```typescript
@Component({
  selector: 'wp-carrier',
  templateUrl: './carrier.component.html',
  styleUrls: ['./carrier.component.scss'],
  standalone: true,
  imports: [TableCommonComponent, PortletComponent, PortletHeaderComponent, PortletBodyComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarrierComponent {
  //#region inject
  private toastr = inject(ToastrService);
  private translate = inject(TranslateService);
  permissionService = inject(PermissionService);   // público: lo usa la plantilla
  carrierStore = inject(CarrierStore);
  //#endregion

  //#region signals del store
  loading = this.carrierStore.isLoading;
  error = this.carrierStore.error;
  //#endregion

  constructor() {
    this.initTableConfig();
    this.carrierStore.resetStore();
    this.carrierStore.loadByCompany(this.activeCompanyLicCod);
  }
}
```

Reglas:
- **Standalone + `ChangeDetectionStrategy.OnPush`** siempre.
- **`inject()`** en componentes. (Los servicios que extienden `BaseService` sí usan constructor: ver `estado.md`.)
- **Control de flujo nuevo** `@if` / `@for (… ; track …)` / `@else if`. Nunca `*ngIf` / `*ngFor`.
- **Código nuevo**: `input()` / `input.required()` / `output()`. Hay componentes legados con `@Input`/`@Output`
  (p. ej. `edit-carrier`); no los migres salvo que la tarea lo pida, pero no añadas más.
- Estado local de UI con `signal()`; derivados con `computed()` (nunca cálculos en la plantilla).
- Reacciones a cambios del store con `effect()` declarado como campo (`private xEffect = effect(() => …)`).
- Agrupa el cuerpo de la clase con `//#region` como el resto del repo.
- Alias de import: `@app/...`. Algunos archivos usan `src/app/...`; ambos compilan, prefiere `@app`.
- Sin lógica de negocio pesada en el componente: va al store o al servicio.

## Estructura de pantalla (portlet)

Toda pantalla usa `wp-portlet`, que emite las clases `.pane` del sistema de diseño:

```html
<wp-portlet>
  <wp-portlet-header>
    <div wpPortletTitle>
      <h1 class="pane__title">{{ 'CARRIER.TITLE' | translate }}</h1>
      <p class="pane__desc">{{ 'COMMONS.PANE_DESC.CARRIERS' | translate }}</p>
    </div>
    <ng-container wpPortletTools>
      @if (permissionService.canWrite('transportistas')) {
        <button class="btn btn-primary me-2" (click)="addCarrier()">
          <i class="bi bi-plus-circle me-2"></i>{{ 'CARRIER.BTN.ADD' | translate }}
        </button>
      }
      <wp-export-btn [data]="displayList()" filename="carriers" [columns]="exportColumns"></wp-export-btn>
    </ng-container>
  </wp-portlet-header>
  <wp-portlet-body>
    <wp-table-common [items]="displayList()" [loading]="loading()" [configColumns]="tableConfig"
      [entityEditPermission]="'transportistas'" [entityDeletePermission]="'transportistas'"
      (onEvent1)="onTableAction($event)">
    </wp-table-common>
  </wp-portlet-body>
</wp-portlet>

@if (showModal()) {
  <wp-edit-carrier [carrierId]="selectedId()" (saved)="onModalSaved()" (cancelled)="closeModal()" />
}
```

## Tabla (`wp-table-common`)

- Columnas en un array `configColumns` construido en `initTableConfig()` con `name`, `label` (vía `translate.instant`),
  `translate` (la clave), `type` (`'string'`, `'customActions'`, …), `visible`, `isSortable`, `isSearchable`.
- Acciones por fila: columna `type: 'customActions'` con `data: [{ name, icon, tooltip, optionClick }]`; el evento
  llega por `(onEvent1)` y se despacha buscando `event.optionClick` en un mapa de acciones.
- Para mostrar valores transformados, crea un `computed()` (`displayXList`) que mapee las entidades; no transformes en la plantilla.

## Modal de edición

- Usa `<wp-modal [title]="title()" (closed)="onClosed()">` (`@app/shared/general/modal/wp-modal.component`).
- Recibe el id (null = alta) y emite `saved` / `cancelled`. El padre lo monta con `@if (showModal())`.
- Formulario reactivo (`FormBuilder`, `ReactiveFormsModule`). Validadores compartidos en `src/app/shared/validators/`
  (`ecuador-id`, `phone`, `ecuador-plate`, `not-blank`…). Longitudes máximas como constantes que reflejan la columna de BD.
- Formularios, loading y feedback: ver `ux.md`.

## TypeScript y documentación

- `strict` está activo. En código nuevo evita `any` (usa el modelo, `unknown` + type guard o un tipo local).
  El repo tiene `any` heredado (p. ej. eventos de tabla); no lo propagues a APIs nuevas.
- Tipa los retornos de métodos públicos y de servicios (`Observable<CarrierModel[]>`).
- Nombres en inglés y `camelCase`/`PascalCase`; booleanos como condición (`isLoading`, `hasRole`, `canEdit`); sin abreviaturas.
- Constantes de módulo en `UPPER_SNAKE_CASE` (`ID_NUMBER_MAX_LENGTH`). El repo usa tanto `enum` (`PermissionType`)
  como objetos `as const`; para catálogos nuevos prefiere `as const` + tipo derivado.
- **JSDoc en español** que explique el *porqué* (regla de negocio, endpoint, decisión), no el *qué*: mira los comentarios de
  `carrier.store.ts` y `carrier.service.ts`. Documenta métodos públicos de stores/servicios y los `effect` no obvios.
- Optional chaining y `??` para nulos; evita `!` sin justificar.

## Checklist

- [ ] Standalone + OnPush, `inject()`, `@if/@for`
- [ ] Pantalla dentro de `wp-portlet` con `pane__title` / `pane__desc`
- [ ] Textos con `| translate` (ver `i18n.md`)
- [ ] Acciones protegidas con `permissionService.canX('<recurso>')` (ver `permisos.md`)
- [ ] Ruta lazy registrada
