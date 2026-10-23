# Estado y datos

Tres piezas por entidad:

```
src/app/store/<feature>/<entidad>/<entidad>.model.ts      ← interfaz del DTO
src/app/store/<feature>/<entidad>/<entidad>.service.ts    ← HTTP (extiende BaseService)
src/app/store/signal-store/<entidad>/<entidad>.store.ts   ← NgRx Signal Store
```

Referencias: `store/admin/carrier/` y `store/signal-store/carrier/carrier.store.ts`.

## Servicio — `BaseService<T>`

`src/app/store/base/_services.base.ts` ya implementa `get`, `getById`, `getByGuid`, `add`, `update`, `delete`,
batch, `find`. Las llamadas pasan por `DataApiService` (`@app/core/services/api`), que antepone la URL base del API
configurada en runtime. **Nunca uses `HttpClient` ni URLs absolutas directamente.**

```typescript
@Injectable({ providedIn: 'root' })
export class CarrierService extends BaseService<CarrierModel> {
  constructor(
    public http: HttpConfigService,
    protected override dataApi: DataApiService,
    httpUtils: HttpUtilService,
    lstore: StoreConfigService,
    private configService: AppConfigService
  ) {
    //   ruta relativa, byCompany (añade /{companyLicCod} en get/getById)
    super(dataApi, httpUtils, lstore, 'Carrier', false);
  }

  getByCompany(companyLicCod: string): Observable<CarrierModel[]> {
    return this.dataApi.get<CarrierModel[]>(`Carrier/company/${companyLicCod}`);
  }
}
```

- Aquí **sí** se usa inyección por constructor: `BaseService` la exige.
- Tipa siempre la respuesta: `dataApi.get<T>(…)`.
- Para el API de autenticación pasa `apiType: 'auth'` (ver `ApiType`).
- La empresa activa se lee de `StoreConfigService`: `lstore.getItem('selectedCompany')?.companyLicCod`.

## Store — `withEntityCrud`

```typescript
export const CarrierStore = signalStore(
  { providedIn: 'root' },
  withEntityCrud<CarrierModel>(() => inject(CarrierService)),
  withMethods((store) => {
    const service = inject(CarrierService);
    return {
      loadByCompany: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((licCod) =>
            service.getByCompany(licCod).pipe(
              tapResponse({
                next: (entities: CarrierModel[]) =>
                  patchState(store, { entities, totalCount: entities.length, isLoading: false, isAllLoaded: true, showInitWaitingMessage: false }),
                error: (error: any) =>
                  patchState(store, { error, isLoading: false, showInitWaitingMessage: false }),
              })
            )
          )
        )
      ),
    };
  })
);
export type CarrierStoreType = InstanceType<typeof CarrierStore>;
```

- Importa `withEntityCrud` desde `'../base'` y **`tapResponse` desde `'../utils/tap-response'`** (no de `@ngrx/operators`).
- La entidad debe tener `id: number | string`.

### Lo que ya da `withEntityCrud` (no lo reimplementes)

Estado (`EntityStateModel<T>`): `entities`, `isLoading`, `actionsLoading`, `totalCount`, `lastCreatedId`,
`selectedId`, `currentEntity`, `lastQuery`, `error`, `isAllLoaded`, `showInitWaitingMessage`, `updated`.

Computed: `selectAll`, `selectTotalCount`, `selectPageLoading`, `selectActionLoading`, `selectLastCreatedId`,
`selectCurrentEntity`, `selectError`, `selectUpdated`, `selectById`, `hasEntities`.

Métodos async (`rxMethod`): `loadAll` (con caché: no recarga si hay entidades), `forceLoadAll`, `loadPage(query)`,
`loadById`, `loadByGuid`, `create`, `createBatch`, `update({ id, entity })`, `delete(id)`, `deleteBatch`.

Síncronos: `clearStore`, `resetStore`, `clearErrors`, `clearLastCreatedId`, `clearUpdated`, `setCurrentEntity`,
`setSelectedId`, `setLoading`, `setActionsLoading`, `addLocal`, `updateLocal`, `removeLocal`, `setEntities`.

### Reglas

- `isLoading` = carga de lista; `actionsLoading` = guardar/borrar. No los mezcles.
- Al inicio de cada operación async: `patchState(store, { isLoading|actionsLoading: true, error: null })`;
  en `next` **y** en `error` devuélvelo a `false`.
- `switchMap` para cargas (cancela la anterior).
- `patchState` solo dentro del store, nunca desde el componente.
- Si el endpoint genérico trae datos de todas las empresas, añade un método `loadByCompany` en lugar de filtrar en el componente.
- Los stores son singletons (`providedIn: 'root'`): llama `resetStore()` al entrar en la pantalla si no quieres datos de una visita anterior.
- No uses NgRx clásico (actions/reducers/effects) para código nuevo.

## Consumir en el componente

```typescript
carrierStore = inject(CarrierStore);
private readonly list = this.carrierStore.selectAll;
loading = this.carrierStore.isLoading;
```

En plantilla siempre como función: `loading()`, `list()`.
El éxito de una acción se detecta con un `effect` que observa `actionsLoading` pasar de `true` a `false` sin `error`
(ver `deleteResultEffect` en `carrier.component.ts` y `ux.md`). No uses `setTimeout`.
