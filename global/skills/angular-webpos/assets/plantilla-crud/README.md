# Plantilla CRUD (lista + modal de edición)

Plantilla limpia para una entidad nueva en un portal Angular WebPOS. Entidad de ejemplo: `Item` / `item`.
Verificada: compila con `tsc` y su spec pasa con Jest contra la estructura real de un portal (BaseService,
`withEntityCrud`, `wp-portlet`, `wp-modal`, `wpBlockUI`, `wp-table-common`, `wp-export-btn`).

## Dónde va cada archivo

| Plantilla | Destino en el proyecto |
|---|---|
| `data/item.model.ts`, `data/item.service.ts` | `src/app/store/<feature>/<entidad>/` |
| `store/item.store.ts` | `src/app/store/signal-store/<entidad>/<entidad>.store.ts` |
| `component/item.component.{ts,html}` | `src/app/views/components/<feature>/<entidad>/` |
| `component/edit-item/edit-item.component.{ts,html}` | `src/app/views/components/<feature>/<entidad>/edit-<entidad>/` |
| `i18n/item.{es,en}.ts` | `src/app/_config/lang/<feature>/<entidad>/<entidad>.{es,en}.ts` |
| `test/edit-item.component.spec.ts` | `test/views/components/<feature>/<entidad>/edit-<entidad>.component.spec.ts` |

No hace falta `.scss`: la pantalla usa solo clases de Bootstrap y del sistema de diseño. Si el componente
necesita estilos propios, crea el `.scss`, añade `styleUrls` y usa solo `var(--token)`.

## Qué renombrar

1. `FEATURE` en los imports → carpeta real de la feature (p. ej. `admin`).
2. `Item`/`item`/`ITEM` → la entidad (`ItemModel`, `ItemService`, `ItemStore`, `ItemComponent`,
   `EditItemComponent`, `wp-item`, `wp-edit-item`, `itemId`, prefijo de traducción `ITEM.`).
3. `'Item'` (ruta del API en el servicio y en `getByCompany`) → el controlador real.
4. `RESOURCE = 'items'` → recurso de permisos (español, plural, kebab-case; ver el contexto del proyecto).
5. Campos `code`/`name` y sus largos (`ITEM_*_MAX_LENGTH`) → los de la entidad, con su columna de BD.
6. `filename="items"` del botón de exportar.

## Después de copiar

- Registra la traducción en `es.ts` **y** `en.ts` (cada uno importa su propio idioma) con la clave `ITEM`.
- Ruta lazy en el `*.routes.ts` de la feature con `loadComponent`, detrás de `authGuard`.
- Añade la descripción de la pantalla si el proyecto la centraliza (p. ej. `COMMONS.PANE_DESC`).
- Valida: `check-i18n.js`, `check-styles.js <carpetas tocadas>`, `npx jest <spec>`.

## Qué NO cambiar al adaptarla

- Colores: SweetAlert con `buttonsStyling: false` + `customClass` (`wp-swal`, `btn-*`), sin `confirmButtonColor`.
- Errores con `ApiErrorService.extract()`, nunca `err.error.detail` a mano.
- Etiquetas de exportación con `translate.instant`, nunca literales.
- Empresa explícita en la ruta (`getByCompany(companyLicCod)`), no `byCompany` de `BaseService`.
- Éxito de acciones deducido de `actionsLoading` en un `effect`, nunca `setTimeout`.
