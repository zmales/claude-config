/**
 * Item de ejemplo. Renombra `Item`/`item` por tu entidad y documenta aquí las reglas de negocio que no se
 * deducen de los nombres (unicidad, campos de solo lectura que gobierna el backend, códigos SRI…).
 */
export interface ItemModel {
  /** `withEntityCrud` exige `id: number | string`. */
  id: number | string;
  guidId: string;
  /** Empresa dueña del registro (la activa en el portal). */
  companyLicCod: string;
  /** Código único por empresa. */
  code: string;
  name: string;
  isActive: boolean;
}

/** Largos máximos: espejo de las columnas de BD. Si cambia la columna, cambia aquí. */
export const ITEM_CODE_MAX_LENGTH = 20;   // Item.Code varchar(20)
export const ITEM_NAME_MAX_LENGTH = 200;  // Item.Name varchar(200)
