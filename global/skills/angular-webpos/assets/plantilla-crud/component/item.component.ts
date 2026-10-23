import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

import { ItemStore } from '@app/store/signal-store/item/item.store';
import { ItemModel } from '@app/store/FEATURE/item/item.model';
import { ApiErrorService } from '@app/core/services/api-error.service';
import { PermissionService } from '@app/core/services/PermissionService.service';
import { StoreConfigService } from '@app/shared/services/store-config.service';
import { TableCommonComponent } from '@app/shared/general/table-common/table-common.component';
import { ExportBtnComponent, ExportColumn } from '@app/shared/general/export-btn/export-btn.component';
import { PortletComponent } from '@app/views/partials/layout/portlet/portlet.component';
import { PortletHeaderComponent } from '@app/views/partials/layout/portlet/portlet-header.component';
import { PortletBodyComponent } from '@app/views/partials/layout/portlet/portlet-body.component';
import { EditItemComponent } from './edit-item/edit-item.component';

/** Recurso de permisos de la pantalla: nombre en español, plural, kebab-case. */
const RESOURCE = 'items';

/** Evento de acción por fila que emite `wp-table-common` por `(onEvent1)`. */
interface TableActionEvent {
  event: { optionClick: string };
  data: ItemModel;
}

/** Tema común de SweetAlert: los colores salen de los tokens vía las clases `.btn-*` y `.wp-swal`. */
const SWAL_THEME = {
  buttonsStyling: false,
  customClass: { popup: 'wp-swal', confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
} as const;

@Component({
  selector: 'wp-item',
  templateUrl: './item.component.html',
  standalone: true,
  imports: [
    TableCommonComponent,
    ExportBtnComponent,
    PortletComponent,
    PortletHeaderComponent,
    PortletBodyComponent,
    TranslateModule,
    EditItemComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemComponent {
  //#region inject
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly apiError = inject(ApiErrorService);
  private readonly lstore = inject(StoreConfigService);
  readonly permissionService = inject(PermissionService); // público: lo usa la plantilla
  readonly itemStore = inject(ItemStore);
  //#endregion

  readonly resource = RESOURCE;
  private readonly companyLicCod: string = this.lstore.getItem('selectedCompany')?.companyLicCod ?? '';

  //#region signals del store
  readonly loading = this.itemStore.isLoading;
  private readonly error = this.itemStore.error;
  private readonly actionsLoading = this.itemStore.actionsLoading;

  /** Copia para tabla y exportación: aquí se transforman valores (nunca en la plantilla). */
  readonly displayList = computed(() =>
    this.itemStore.selectAll().map((item) => ({
      ...item,
      status: this.translate.instant(item.isActive ? 'ITEM.TABLE.ACTIVE' : 'ITEM.TABLE.INACTIVE'),
    }))
  );
  //#endregion

  //#region modal
  readonly showModal = signal(false);
  readonly selectedId = signal<number | string | null>(null);
  //#endregion

  /** Etiquetas de exportación traducidas: nunca texto literal. */
  readonly exportColumns: ExportColumn[] = [
    { field: 'code', label: this.translate.instant('ITEM.TABLE.CODE') },
    { field: 'name', label: this.translate.instant('ITEM.TABLE.NAME') },
    { field: 'status', label: this.translate.instant('ITEM.TABLE.STATUS') },
  ];

  readonly tableConfig = this.buildTableConfig();

  //#region effects
  /** Borrado despachado y aún sin resolver: el éxito se deduce de `actionsLoading` (true → false sin error). */
  private readonly pendingDelete = signal(false);
  private wasDeleting = false;
  private previousError: unknown = null;

  private readonly errorEffect = effect(() => {
    const error = this.error();
    // Con el modal abierto, el error lo muestra el modal.
    if (error && error !== this.previousError && !this.showModal()) {
      this.toastr.error(
        typeof error === 'string'
          ? error
          : this.apiError.extract(error as HttpErrorResponse, 'COMMONS.MESSAGES.OPERATION_ERROR')
      );
    }
    this.previousError = error;
  });

  private readonly deleteResultEffect = effect(() => {
    if (!this.pendingDelete()) return;
    if (this.actionsLoading()) { this.wasDeleting = true; return; }
    if (!this.wasDeleting) return;
    this.wasDeleting = false;
    this.pendingDelete.set(false);
    if (!this.error()) this.toastr.success(this.translate.instant('ITEM.MESSAGES.DELETE_SUCCESS'));
  });
  //#endregion

  constructor() {
    // Store singleton: se limpia para no mostrar datos de otra empresa o de una visita anterior.
    this.itemStore.resetStore();
    this.itemStore.loadByCompany(this.companyLicCod);
  }

  //#region acciones
  add(): void {
    this.selectedId.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onTableAction(e: TableActionEvent): void {
    const actions: Record<string, (item: ItemModel) => void> = {
      editItem: (item) => this.edit(item),
      deleteItem: (item) => this.confirmDelete(item),
    };
    actions[e.event.optionClick]?.(e.data);
  }

  private edit(item: ItemModel): void {
    this.selectedId.set(item.id);
    this.showModal.set(true);
  }

  private confirmDelete(item: ItemModel): void {
    Swal.fire({
      ...SWAL_THEME,
      title: this.translate.instant('COMMONS.CONFIRM.ARE_YOU_SURE'),
      text: this.translate.instant('ITEM.CONFIRM.DELETE', { name: item.name }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMONS.BUTTONS.YES_DELETE'),
      cancelButtonText: this.translate.instant('COMMONS.BUTTONS.CANCEL'),
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.itemStore.clearErrors();
      this.wasDeleting = false;
      this.pendingDelete.set(true);
      this.itemStore.delete(item.id);
    });
  }
  //#endregion

  //#region table config
  private buildTableConfig() {
    const col = (name: string, key: string) => ({
      name,
      label: this.translate.instant(key),
      translate: key,
      visible: true,
      type: 'string',
      isSortable: true,
      isSearchable: true,
    });
    return [
      {
        name: 'CustomActions',
        label: this.translate.instant('COMMONS.TABLE.ACTIONS'),
        translate: 'COMMONS.TABLE.ACTIONS',
        visible: true,
        type: 'customActions',
        data: [
          {
            name: 'Edit',
            label: this.translate.instant('COMMONS.TABLE.EDIT'),
            translate: 'COMMONS.TABLE.EDIT',
            icon: 'bi bi-pencil',
            tooltip: this.translate.instant('ITEM.TABLE.EDIT_TOOLTIP'),
            optionClick: 'editItem',
          },
          {
            name: 'Delete',
            label: this.translate.instant('COMMONS.TABLE.DELETE'),
            translate: 'COMMONS.TABLE.DELETE',
            icon: 'bi bi-trash',
            tooltip: this.translate.instant('ITEM.TABLE.DELETE_TOOLTIP'),
            optionClick: 'deleteItem',
          },
        ],
      },
      col('code', 'ITEM.TABLE.CODE'),
      col('name', 'ITEM.TABLE.NAME'),
      col('status', 'ITEM.TABLE.STATUS'),
    ];
  }
  //#endregion
}
