import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseService } from '@app/store/base/_services.base';
import { DataApiService } from '@app/core/services/api';
import { HttpUtilService } from '@app/core/services/Utils/http-utils.service';
import { StoreConfigService } from '@app/shared/services/store-config.service';
import { ItemModel } from './item.model';

/**
 * Endpoint `/api/v1/Item`. Hereda get/getById/add/update/delete de `BaseService`; aquí solo va lo propio.
 * `byCompany` va en `false`: la empresa se pasa explícita en la ruta (ver `getByCompany`).
 */
@Injectable({ providedIn: 'root' })
export class ItemService extends BaseService<ItemModel> {
  constructor(dataApi: DataApiService, httpUtils: HttpUtilService, lstore: StoreConfigService) {
    // BaseService exige inyección por constructor.
    super(dataApi, httpUtils, lstore, 'Item', false);
  }

  /** Items de UNA empresa. El backend filtra por rol y empresa; el cliente no filtra. */
  getByCompany(companyLicCod: string): Observable<ItemModel[]> {
    return this.dataApi.get<ItemModel[]>(`Item/company/${companyLicCod}`);
  }
}
