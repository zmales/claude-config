import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ItemStore } from '@app/store/signal-store/item/item.store';
import { ITEM_CODE_MAX_LENGTH, ITEM_NAME_MAX_LENGTH, ItemModel } from '@app/store/FEATURE/item/item.model';
import { ApiErrorService } from '@app/core/services/api-error.service';
import { BlockUIDirective } from '@app/core/directives/block-ui.directive';
import { WpModalComponent } from '@app/shared/general/modal/wp-modal.component';
import { StoreConfigService } from '@app/shared/services/store-config.service';
import { notBlankValidator } from '@app/shared/validators/not-blank.validator';

@Component({
  selector: 'wp-edit-item',
  templateUrl: './edit-item.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, BlockUIDirective, WpModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditItemComponent implements OnInit {
  /** null = alta; id = edición. */
  readonly itemId = input<number | string | null>(null);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  //#region inject
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly translate = inject(TranslateService);
  private readonly apiError = inject(ApiErrorService);
  private readonly lstore = inject(StoreConfigService);
  readonly itemStore = inject(ItemStore);
  //#endregion

  readonly codeMaxLength = ITEM_CODE_MAX_LENGTH;
  readonly nameMaxLength = ITEM_NAME_MAX_LENGTH;
  private readonly companyLicCod: string = this.lstore.getItem('selectedCompany')?.companyLicCod ?? '';

  readonly form = this.fb.nonNullable.group({
    code: ['', [notBlankValidator(), Validators.maxLength(ITEM_CODE_MAX_LENGTH)]],
    name: ['', [notBlankValidator(), Validators.maxLength(ITEM_NAME_MAX_LENGTH)]],
  });

  //#region signals
  readonly saving = this.itemStore.actionsLoading; // guardar
  readonly dataLoading = this.itemStore.isLoading; // cargar el registro
  private readonly error = this.itemStore.error;
  readonly isEditMode = computed(() => this.itemId() != null);
  readonly title = computed(() =>
    this.translate.instant(this.isEditMode() ? 'ITEM.TITLE_EDIT' : 'ITEM.TITLE_ADD')
  );
  //#endregion

  private readonly hasPatched = signal(false);
  private readonly pendingUpdate = signal(false);
  private wasSaving = false;
  private handledCreatedId: number | string | null = null;
  private previousError: unknown = null;

  ngOnInit(): void {
    this.itemStore.clearErrors();
    const id = this.itemId();
    if (id != null) this.itemStore.loadById(id);
  }

  //#region effects
  /** Rellena el formulario una sola vez cuando llega el registro en edición. */
  private readonly populateEffect = effect(() => {
    if (!this.isEditMode() || this.hasPatched()) return;
    const entity = this.itemStore.currentEntity();
    // El store es singleton: se ignora un currentEntity que no sea el registro pedido.
    if (!entity || String(entity.id) !== String(this.itemId())) return;
    this.form.reset({ code: entity.code ?? '', name: entity.name ?? '' }, { emitEvent: false });
    this.hasPatched.set(true);
  });

  private readonly errorEffect = effect(() => {
    const error = this.error();
    if (!error || error === this.previousError) return;
    this.previousError = error;
    // 409 = código duplicado: el error se muestra en el campo, además del aviso.
    if ((error as HttpErrorResponse)?.status === 409) {
      this.form.controls.code.setErrors({ duplicate: true });
      this.form.controls.code.markAsTouched();
    }
    this.toastr.error(
      typeof error === 'string'
        ? error
        : this.apiError.extract(error as HttpErrorResponse, 'COMMONS.MESSAGES.OPERATION_ERROR')
    );
  });

  /** Alta correcta: el store deja `lastCreatedId` al terminar `create`. */
  private readonly createdEffect = effect(() => {
    const lastId = this.itemStore.lastCreatedId();
    if (this.saving() || !lastId || this.isEditMode() || lastId === this.handledCreatedId) return;
    this.handledCreatedId = lastId;
    this.itemStore.clearLastCreatedId();
    this.toastr.success(this.translate.instant('ITEM.MESSAGES.CREATE_SUCCESS'));
    this.saved.emit();
  });

  /** Edición correcta: `actionsLoading` pasa de true a false sin error. Nunca setTimeout. */
  private readonly updatedEffect = effect(() => {
    if (!this.pendingUpdate()) return;
    if (this.saving()) { this.wasSaving = true; return; }
    if (!this.wasSaving) return;
    this.wasSaving = false;
    this.pendingUpdate.set(false);
    if (!this.error()) {
      this.toastr.success(this.translate.instant('ITEM.MESSAGES.UPDATE_SUCCESS'));
      this.saved.emit();
    }
  });
  //#endregion

  /** `wp-modal` no permite deshabilitar su "X": se ignora el cierre mientras se guarda. */
  onClosed(): void {
    if (!this.saving()) this.cancelled.emit();
  }

  /** Quita espacios de los extremos al salir del campo. */
  trim(control: 'code' | 'name'): void {
    const ctrl = this.form.controls[control];
    const trimmed = ctrl.value.trim();
    if (trimmed !== ctrl.value) ctrl.setValue(trimmed);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning(this.translate.instant('COMMONS.MESSAGES.FIELDS_INCOMPLETE'));
      return;
    }
    this.itemStore.clearErrors();
    const entity = this.toEntity();
    const id = this.itemId();
    if (id != null) {
      this.wasSaving = false;
      this.pendingUpdate.set(true);
      this.itemStore.update({ id, entity });
    } else {
      this.itemStore.create(entity);
    }
  }

  private toEntity(): ItemModel {
    const raw = this.form.getRawValue();
    return {
      id: this.itemId() ?? 0,
      guidId: this.itemStore.currentEntity()?.guidId ?? '',
      companyLicCod: this.companyLicCod,
      code: raw.code.trim().toUpperCase(), // se normaliza al guardar, no al teclear
      name: raw.name.trim(),
      isActive: true,
    };
  }

  // Accesos cortos para la plantilla.
  get code() { return this.form.controls.code; }
  get name() { return this.form.controls.name; }
}
