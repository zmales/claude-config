# Tests (Jest)

- Runner: **Jest** con `jest-preset-angular` (`jest.config.ts`, setup en `test/setup-jest.ts` con `setupZoneTestEnv()`).
  Nunca Karma/Jasmine (`jest.fn()`, no `jasmine.createSpy()`).
- Ubicación: carpeta `test/` en la raíz, **espejo de `src/app/`**:
  `src/app/views/components/<feature>/<entidad>/edit-<entidad>/…` → `test/views/components/<feature>/<entidad>/edit-<entidad>.component.spec.ts`.
  Varios specs por componente se nombran por tema: `<entidad>.reload.spec.ts`, `<entidad>.xml-modal.spec.ts`.
- `moduleNameMapper` replica los alias de `tsconfig` (`@app/...`, `@environments/...`); `transformIgnorePatterns`
  deja pasar los paquetes ESM (`@angular`, `@ngrx`, `@ngx-translate`, `ngx-toastr`, `angular-oauth2-oidc`…).
  Si añades una dependencia ESM y Jest falla con "Cannot use import statement outside a module", agrégala ahí.
- Ejecutar: `npx jest <ruta>` (o `npm test` para todo).
- Plantilla: `assets/plantilla-crud/test/edit-item.component.spec.ts`.

## Patrón

```typescript
describe('EditItemComponent', () => {
  let store: { currentEntity: WritableSignal<ItemModel | null>; actionsLoading: WritableSignal<boolean>; /* … */ create: jest.Mock };
  let toastr: { success: jest.Mock; error: jest.Mock; warning: jest.Mock };
  let fixture: ComponentFixture<EditItemComponent>;

  function create(itemId: number | null = null) {
    fixture = TestBed.createComponent(EditItemComponent);
    fixture.componentRef.setInput('itemId', itemId);   // inputs de señal: setInput, no asignación
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    // El store se simula con signals reales: así los effect() del componente reaccionan.
    store = { currentEntity: signal(null), actionsLoading: signal(false), /* … */ create: jest.fn() };
    TestBed.configureTestingModule({
      imports: [EditItemComponent],
      providers: [
        { provide: ItemStore, useValue: store },
        { provide: ToastrService, useValue: toastr },
        { provide: TranslateService, useValue: { instant: (k: string) => k } },
        { provide: StoreConfigService, useValue: { getItem: () => ({ companyLicCod: 'LIC1' }) } },
      ],
    });
    // La lógica vive en la clase: se omite la plantilla para no arrastrar wp-modal, wpBlockUI, etc.
    TestBed.overrideComponent(EditItemComponent, { set: { template: '', imports: [] } });
  });

  afterEach(() => jest.clearAllMocks());

  it('muestra un solo toast de creación aunque el efecto se reevalúe', () => {
    create();
    store.actionsLoading.set(true);  fixture.detectChanges();
    store.lastCreatedId.set(9);
    store.actionsLoading.set(false); fixture.detectChanges();
    expect(toastr.success).toHaveBeenCalledTimes(1);
  });
});
```

## Otros casos

- **Servicio sin TestBed**: instancia la clase pasando mocks al constructor (`new ItemService(dataApiMock, httpUtilsMock, lstoreMock)`)
  y verifica la URL/parámetros enviados a `dataApi`.
- **Guard funcional**: `TestBed.runInInjectionContext(() => authGuard(route, state))` con `PermissionService`/`Router` mockeados.
- **Store**: `TestBed.inject(ItemStore)` con el servicio mockeado devolviendo `of(...)`; llama al método y
  comprueba `store.entities()`, `store.isLoading()`, `store.error()`.
- No uses `HttpClient` real ni `TestBed.inject(HttpClient)`: mockea el servicio de dominio.

## Qué probar

- Validaciones del formulario (requeridos, formatos, duplicados, solo espacios).
- Efectos sobre el store: toasts de éxito/error una sola vez, cierre del modal, navegación.
- Transformaciones de `computed()` para tabla/exportación.
- Servicios con lógica propia (no los métodos heredados de `BaseService`).

## Reglas

- Mocks de store con `signal()`, no con valores planos, o los `effect` no se disparan.
- `TranslateService` mock con `instant: k => k` (o un mapa de etiquetas si el texto importa en la aserción).
- Nombres de `it(...)` en español, describiendo el comportamiento esperado.
- Un test por comportamiento; nada de snapshots de plantillas completas.
