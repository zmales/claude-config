/** Textos de la pantalla Items. Mismas claves que `item.en.ts` (verifícalo con check-i18n.js). */
export const item = {
  TITLE: 'Items',
  DESC: 'Administra los items de la empresa activa.',
  TITLE_ADD: 'Agregar item',
  TITLE_EDIT: 'Editar item',
  BTN: {
    ADD: 'Agregar item',
  },
  TABLE: {
    CODE: 'Código',
    NAME: 'Nombre',
    STATUS: 'Estado',
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    EDIT_TOOLTIP: 'Editar item',
    DELETE_TOOLTIP: 'Eliminar item',
  },
  FORM: {
    REQUIRED_LEGEND: 'Campos obligatorios',
    CODE_LABEL: 'Código',
    CODE_PLACEHOLDER: 'Ej: ITM-001',
    NAME_LABEL: 'Nombre',
    NAME_PLACEHOLDER: 'Nombre del item',
  },
  VALIDATION: {
    CODE_REQUIRED: 'El código es obligatorio.',
    CODE_DUPLICATE: 'Ya existe un item con este código.',
    NAME_REQUIRED: 'El nombre es obligatorio.',
  },
  MESSAGES: {
    CREATE_SUCCESS: 'Item creado correctamente.',
    UPDATE_SUCCESS: 'Item actualizado correctamente.',
    DELETE_SUCCESS: 'Item eliminado correctamente.',
  },
  CONFIRM: {
    DELETE: '¿Desea eliminar el item "{{name}}"? Esta acción no se puede deshacer.',
  },
};
