# Estado y datos

Tres piezas por entidad:

```
src/app/store/<feature>/<entidad>/<entidad>.model.ts      ← interfaz del DTO
src/app/store/<feature>/<entidad>/<entidad>.service.ts    ← HTTP (extiende BaseService)
src/app/store/signal-store/<entidad>/<entidad>.store.ts   ← NgRx Signal Store
```

Plantillas: `assets/plantilla-crud/data/` y `assets/plantilla-crud/store/`.

## Servicio — `BaseService<T>`

`src/app/store/base/_services.base.ts` ya implementa `get`, `getById`, `getByGuid`, `add`, `update`, `delete`,
batch, `find`. Las llamadas pasan por `DataApiService` (`@app/core/services/api`), que antepone la URL base del API
configurada en runtime. **Nunca uses `HttpClient` ni URLs absolutas directamente.**

```typescript
@Injectable({ providedIn: 'root' })
export class ItemService extends BaseService<ItemModel> {
  constructor(dataApi: DataApiService, httpUtils: HttpUtilService, lstore: StoreConfigService) {
    super(dataApi, httpUtils, lstore, 'Item', false);   // ruta relativa, byCompany = false
  }

  getByCompany(companyLicCod: string): Observable<ItemModel[]> {
    return this.dataApi.get<ItemModel[]>(`Item/company/${companyLicCod}`);
  }
}
```

- Aquí **sí** se usa inyección por constructor: `BaseService` la exige. Inyecta solo lo que uses.
- Tipa siempre la respuesta: `dataApi.get<T>(…)`.
- Para el API de autenticación pasa `apiType: 'auth'` (ver `ApiType`).
- **Empresa explícita en la ruta**: pasa `companyLicCod` como parámetro (`Item/company/{licCod}`). No pongas
  `byCompany = true`: el `BaseService` lee la empresa de una clave de almacenamiento que puede no coincidir con la
  que usa la app (revisa el contexto del proyecto) y la URL saldría sin empresa sin dar error.
- La empresa activa se lee de `StoreConfigService` (`lstore.getItem('selectedCompany')?.companyLicCod`, o la clave
  que indique el contexto del proyecto).

## Store — `withEntityCrud`

```typescript
export const ItemStore = signalStore(
  { providedIn: 'root' },
  withEntityCrud<ItemModel>(() => inject(ItemService)),
  withMethods((store) => {
    const service = inject(ItemService);
    return {
      loadByCompany: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((licCod) =>
            service.getByCompany(licCod).pipe(
              tapResponse({
                next: (entities: ItemModel[]) =>
                  patchState(store, { entities, totalCount: entities.length, isLoading: false, isAllLoaded: true, showInitWaitingMessage: false }),
                error: (error: unknown) =>
                  patchState(store, { error, isLoading: false, showInitWaitingMessage: false }),
              })
            )
          )
        )
      ),
    };
  })
);
export type ItemStoreType = InstanceType<typeof ItemStore>;
```

- Importa `withEntityCrud` desde `'../base'` y **`tapResponse` desde `'../utils/tap-response'`** (no de `@ngrx/operators`).
- La entidad debe tener `id: number | string`.

### Lo que ya da `withEntityCrud` (no lo reimplementes)

Estado (`EntityStateModel<T>`): `entities`, `isLoading`, `actionsLoading`, `totalCount`, `lastCreatedId`,
`selectedId`, `currentEntity`, `lastQuery`, `error`, `isAllLoaded`, `showInitWaitingMessage`, `updated`.

Computed: `selectAll`, `selectTotalCount`, `selectPageLoading`, `selectActionLoading`, `selectLastCreatedId`,
`selectCurrentEntity`, `selectError`, `selectUpdated`, `selectById`, `hasEntities`.

Métodos async (`rxMethod`): `loadAll` (con caché: no recarga si hay entidades), `forceLoadAll`, `loadPage(query)`,
`loadById` (limpia `currentEntity` antes de pedir), `loadByGuid`, `create`, `createBatch`, `update({ id, entity })`,
`delete(id)`, `deleteBatch`.

Síncronos: `clearStore`, `resetStore`, `clearErrors`, `clearLastCreatedId`, `clearUpdated`, `setCurrentEntity`,
`setSelectedId`, `setLoading`, `setActionsLoading`, `addLocal`, `updateLocal`, `removeLocal`, `setEntities`.

### Reglas

- `isLoading` = carga de lista/registro; `actionsLoading` = guardar/borrar. No los mezcles.
- Al inicio de cada operación async: `patchState(store, { isLoading|actionsLoading: true, error: null })`;
  en `next` **y** en `error` devuélvelo a `false`. `tapResponse` en todo `rxMethod`.
- `switchMap` para cargas (cancela la anterior).
- `patchState` solo dentro del store, nunca desde el componente.
- Si el endpoint genérico trae datos de todas las empresas, añade `loadByCompany` en lugar de filtrar en el componente.
- Los stores son singletons (`providedIn: 'root'`): llama `resetStore()` al entrar en la pantalla si no quieres datos
  de una visita anterior.
- No uses NgRx clásico (actions/reducers/effects) para código nuevo.

## Consumir en el componente

```typescript
readonly itemStore = inject(ItemStore);
readonly loading = this.itemStore.isLoading;
readonly displayList = computed(() => this.itemStore.selectAll().map(/* … */));
```

En plantilla siempre como función: `loading()`, `displayList()`. No uses `subscribe()` sobre el store.
El éxito de una acción se detecta con un `effect` que observa `actionsLoading` pasar de `true` a `false` sin `error`
(ver `ux.md` y la plantilla). No uses `setTimeout`.
