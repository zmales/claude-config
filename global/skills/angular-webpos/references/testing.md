# Tests (Jest)

- Runner: **Jest** con `jest-preset-angular` (`jest.config.ts`, setup en `test/setup-jest.ts` con `setupZoneTestEnv()`).
  No Karma/Jasmine.
- Ubicación: carpeta `test/` en la raíz, **espejo de `src/app/`**:
  `src/app/views/components/admin/carrier/edit-carrier/…` → `test/views/components/admin/carrier/edit-carrier.component.spec.ts`.
  Varios specs por componente se nombran por tema: `fiscal-docs.reload.spec.ts`, `fiscal-docs.xml-modal.spec.ts`.
- Alias disponibles: `@app/...`, `@environments/...`.
- Ejecutar: `npx jest test/views/components/admin/carrier` (o `npm test` para todo).
- Referencia: `test/views/components/admin/carrier/edit-carrier.component.spec.ts`.

## Patrón

```typescript
describe('EditCarrierComponent', () => {
  let storeMock: any;
  let toastr: { success: jest.Mock; error: jest.Mock };
  let fixture: any;

  function create(id: number | null = null) {
    fixture = TestBed.createComponent(EditCarrierComponent);
    fixture.componentInstance.carrierId = id;
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    // El store se simula con signals reales: así los effect() del componente reaccionan.
    storeMock = {
      entities: signal<any[]>([]),
      currentEntity: signal<any>(null),
      isLoading: signal(false),
      actionsLoading: signal(false),
      error: signal<any>(null),
      lastCreatedId: signal<number | null>(null),
      loadById: jest.fn(), create: jest.fn(), update: jest.fn(), clearErrors: jest.fn(),
    };
    toastr = { success: jest.fn(), error: jest.fn() };

    TestBed.configureTestingModule({
      imports: [EditCarrierComponent],
      providers: [
        { provide: CarrierStore, useValue: storeMock },
        { provide: ToastrService, useValue: toastr },
        { provide: TranslateService, useValue: { instant: (k: string) => k } },
        { provide: StoreConfigService, useValue: { getItem: () => ({ companyLicCod: 'LIC1' }) } },
      ],
    });
    // La lógica vive en la clase: se omite la plantilla para no arrastrar wp-modal, BlockUI, etc.
    TestBed.overrideComponent(EditCarrierComponent, { set: { template: '', imports: [] } });
  });

  it('muestra un solo toast de creación aunque el efecto se reevalúe', () => {
    create();
    storeMock.lastCreatedId.set(9);
    storeMock.actionsLoading.set(true);  fixture.detectChanges();
    storeMock.actionsLoading.set(false); fixture.detectChanges();
    expect(toastr.success).toHaveBeenCalledTimes(1);
  });
});
```

## Otros casos

- **Servicio sin TestBed**: instancia la clase pasando mocks al constructor (`new CarrierService(httpMock, dataApiMock, …)`)
  y verifica la URL/parámetros enviados a `dataApi`.
- **Guard funcional**: `TestBed.runInInjectionContext(() => authGuard(route, state))` con `PermissionService`/`Router` mockeados.
- **Store**: `TestBed.inject(CarrierStore)` con el servicio mockeado devolviendo `of(...)`; llama al método y
  comprueba `store.entities()`, `store.isLoading()`, `store.error()`.
- Limpia mocks entre tests (`jest.clearAllMocks()` en `afterEach`) cuando reutilices mocks de módulo.
- Ejemplos reales de servicios: `test/core/services/` (`api-error.service.spec.ts`, `idle-timer.service.spec.ts`,
  `permission-service-*.spec.ts`).

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
