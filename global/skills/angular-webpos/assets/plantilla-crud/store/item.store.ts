import { inject } from '@angular/core';
import { patchState, signalStore, withMethods } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

import { withEntityCrud } from '../base';
import { tapResponse } from '../utils/tap-response';
import { ItemModel } from '@app/store/FEATURE/item/item.model';
import { ItemService } from '@app/store/FEATURE/item/item.service';

export const ItemStore = signalStore(
  { providedIn: 'root' },
  withEntityCrud<ItemModel>(() => inject(ItemService)),

  withMethods((store) => {
    const service = inject(ItemService);

    return {
      /**
       * Carga los items de UNA empresa (`Item/company/{companyLicCod}`). Es el que usa la pantalla:
       * `loadAll()` (heredado) pega a `GET Item` sin empresa.
       */
      loadByCompany: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap((companyLicCod) =>
            service.getByCompany(companyLicCod).pipe(
              tapResponse({
                next: (entities: ItemModel[]) =>
                  patchState(store, {
                    entities,
                    totalCount: entities.length,
                    isLoading: false,
                    isAllLoaded: true,
                    showInitWaitingMessage: false,
                  }),
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
