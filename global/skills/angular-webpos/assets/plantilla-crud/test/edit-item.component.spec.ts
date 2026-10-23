import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { EditItemComponent } from '@app/views/components/FEATURE/item/edit-item/edit-item.component';
import { ItemStore } from '@app/store/signal-store/item/item.store';
import { ItemModel } from '@app/store/FEATURE/item/item.model';
import { StoreConfigService } from '@app/shared/services/store-config.service';
import { ApiErrorService } from '@app/core/services/api-error.service';

describe('EditItemComponent', () => {
  // El store se simula con signals reales: así los effect() del componente reaccionan.
  let store: {
    currentEntity: WritableSignal<ItemModel | null>;
    isLoading: WritableSignal<boolean>;
    actionsLoading: WritableSignal<boolean>;
    error: WritableSignal<unknown>;
    lastCreatedId: WritableSignal<number | string | null>;
    loadById: jest.Mock; create: jest.Mock; update: jest.Mock;
    clearErrors: jest.Mock; clearLastCreatedId: jest.Mock;
  };
  let toastr: { success: jest.Mock; error: jest.Mock; warning: jest.Mock };
  let fixture: ComponentFixture<EditItemComponent>;

  function create(itemId: number | null = null): EditItemComponent {
    fixture = TestBed.createComponent(EditItemComponent);
    fixture.componentRef.setInput('itemId', itemId);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    store = {
      currentEntity: signal<ItemModel | null>(null),
      isLoading: signal(false),
      actionsLoading: signal(false),
      error: signal<unknown>(null),
      lastCreatedId: signal<number | string | null>(null),
      loadById: jest.fn(), create: jest.fn(), update: jest.fn(),
      clearErrors: jest.fn(), clearLastCreatedId: jest.fn(),
    };
    toastr = { success: jest.fn(), error: jest.fn(), warning: jest.fn() };

    TestBed.configureTestingModule({
      imports: [EditItemComponent],
      providers: [
        { provide: ItemStore, useValue: store },
        { provide: ToastrService, useValue: toastr },
        { provide: TranslateService, useValue: { instant: (k: string) => k } },
        { provide: StoreConfigService, useValue: { getItem: () => ({ companyLicCod: 'LIC1' }) } },
        { provide: ApiErrorService, useValue: { extract: () => 'error del backend' } },
      ],
    });
    // La lógica vive en la clase: se omite la plantilla para no arrastrar wp-modal, wpBlockUI, etc.
    TestBed.overrideComponent(EditItemComponent, { set: { template: '', imports: [] } });
  });

  afterEach(() => jest.clearAllMocks());

  it('no envía un formulario con campos solo de espacios', () => {
    const c = create();
    c.form.setValue({ code: '   ', name: 'Item' });
    c.onSubmit();
    expect(store.create).not.toHaveBeenCalled();
    expect(toastr.warning).toHaveBeenCalledWith('COMMONS.MESSAGES.FIELDS_INCOMPLETE');
  });

  it('crea con los valores normalizados y la empresa activa', () => {
    const c = create();
    c.form.setValue({ code: ' itm-1 ', name: ' Item 1 ' });
    c.onSubmit();
    expect(store.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ITM-1', name: 'Item 1', companyLicCod: 'LIC1' })
    );
  });

  it('muestra un solo toast de creación aunque el efecto se reevalúe', () => {
    create();
    store.actionsLoading.set(true); fixture.detectChanges();
    store.lastCreatedId.set(9);
    store.actionsLoading.set(false); fixture.detectChanges();
    fixture.detectChanges();
    expect(toastr.success).toHaveBeenCalledTimes(1);
  });

  it('carga el registro en edición y rellena el formulario', () => {
    const c = create(5);
    expect(store.loadById).toHaveBeenCalledWith(5);
    store.currentEntity.set({ id: 5, guidId: 'g', companyLicCod: 'LIC1', code: 'A1', name: 'Uno', isActive: true });
    fixture.detectChanges();
    expect(c.form.getRawValue()).toEqual({ code: 'A1', name: 'Uno' });
  });

  it('marca el código como duplicado ante un 409', () => {
    const c = create();
    store.error.set(new HttpErrorResponse({ status: 409 }));
    fixture.detectChanges();
    expect(c.form.controls.code.hasError('duplicate')).toBe(true);
    expect(toastr.error).toHaveBeenCalledTimes(1);
  });
});
