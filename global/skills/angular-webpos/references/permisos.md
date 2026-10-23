# Permisos

Servicio: `PermissionService` (`@app/core/services/PermissionService.service`). Sus datos son signals, así que los
bindings en plantilla se reevalúan solos cuando llegan los permisos.

## Cómo funcionan

- Los roles de administración/soporte de WebPOS tienen **acceso total**: todo `canX()` devuelve `true`
  (la lista exacta de roles está en el servicio).
- Para el resto, el permiso se concede si cualquiera de las filas de permisos cargadas para el usuario lo tiene. El
  argumento `resource` puede ser **informativo** según el backend del proyecto, pero pásalo siempre: documenta la
  intención y queda preparado para permisos granulares.
- Tipos (`PermissionType`): `read`, `write`, `download`, `delete`, `upload`, `export`, `import`, `admin`.

## API para pantallas

| Método | Uso |
|---|---|
| `canRead/canWrite/canDelete/canExport/canImport/canDownload/canUpload(resource)` | Botones y acciones |
| `can(PermissionType.X)` | Componentes compartidos sin recurso (tabla, exportar) |
| `hasRole(r)`, `hasAnyRole([...])`, `hasAllRoles([...])` | Lógica por rol |
| `hasPermission(p)`, `hasAnyPermission([...])` | Permisos simples por nombre |

Recursos: nombre de la entidad **en español, plural, kebab-case** (`clientes`, `punto-emision`…). La lista real de
cada proyecto está en su skill de contexto; para una entidad nueva sigue la misma forma.

## Patrón en plantilla (preferido)

```html
@if (permissionService.canWrite(resource)) {
  <button type="button" class="btn btn-primary" (click)="add()">…</button>
}

<wp-table-common … [entityEditPermission]="resource" [entityDeletePermission]="resource" />
```

`permissionService` se inyecta como propiedad **pública** del componente y el recurso va en una constante/propiedad.

## Directivas disponibles (`@app/shared/general/directives/`)

Ambas aceptan: rol (`'Rol'`), array de roles/permisos, `{ resource, permission }`, `{ role }` o `{ roles: [...] }`.

- `*wpHasPermission` (`has-permission.directive`): **quita** el elemento del DOM si no hay permiso.
- `[wpDisableIfNoPermission]` (`disable-if-no-permission.directive`): **muestra el elemento deshabilitado**
  (`disabled`, clase `disabled`, opacidad y `pointer-events: none`).
  ```html
  <button type="button" class="btn btn-secondary" [wpDisableIfNoPermission]="{ resource: 'items', permission: 'export' }">…</button>
  ```
  Úsala solo cuando el usuario deba **ver** que la acción existe pero no puede usarla. Evalúa el permiso **una vez**
  en `ngOnInit` (no reacciona si los permisos llegan después) y aplica estilos inline: úsala solo en pantallas a las que
  se llega con los permisos ya cargados.

Por defecto prefiere `@if` + `canX()`: es reactivo y es lo más usado.

## Guards de ruta (`src/app/core/guard/`)

Funcionales (`CanActivateFn`). `authGuard` siempre primero en `canActivate`. Sin llamadas HTTP dentro de un guard:
solo consultan el estado de `PermissionService`.

## Reglas

- Oculta (no solo deshabilites) las acciones que el usuario no puede ejecutar, salvo el caso de `wpDisableIfNoPermission`.
- La UI no es la seguridad: el backend valida igual; no confíes en el ocultamiento.
- No dupliques lógica de permisos en el componente (nada de `roles.includes('Admin')` a mano): usa el servicio.
