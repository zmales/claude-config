# Permisos

Servicio: `PermissionService` (`@app/core/services/PermissionService.service`). Sus datos son signals, así que
los bindings en plantilla se reevalúan solos cuando llegan los permisos.

## Cómo funcionan realmente

- `WPAdmin`, `webpos_admin`, `WPSupport`, `webpos_support` y `FeEcAdmin` tienen **acceso total**: todo `canX()` devuelve `true`.
- Para el resto, los permisos **no son por tabla**: hay una fila por tipo de usuario (`admin` / `usuario` / `cliente`)
  y el permiso se concede si cualquier fila cargada lo tiene. El argumento `resource` es **informativo**, pero pásalo
  igual (documenta la intención y queda preparado si el backend pasa a granular).
- Tipos (`PermissionType`): `read`, `write`, `download`, `delete`, `upload`, `export`, `import`, `admin`.

## API para pantallas

| Método | Uso |
|---|---|
| `canRead/canWrite/canDelete/canExport/canImport/canDownload/canUpload(resource)` | Botones y acciones |
| `can(PermissionType.X)` | Componentes compartidos sin recurso (tabla, exportar) |
| `hasRole(r)`, `hasAnyRole([...])`, `hasAllRoles([...])` | Lógica por rol |
| `hasPermission(p)`, `hasAnyPermission([...])` | Permisos simples por nombre |

Recursos usados hoy: `clientes`, `proveedores`, `transportistas`, `productos`, `sucursal`, `punto-emision`,
`empresa`, `usuario`. Para una entidad nueva, usa su nombre en español en plural/kebab-case, igual que estos.

## Patrón en plantilla (el que usa el repo)

```html
@if (permissionService.canWrite('transportistas')) {
  <button class="btn btn-primary" (click)="add()">…</button>
}

<wp-table-common … [entityEditPermission]="'transportistas'" [entityDeletePermission]="'transportistas'">
```

`permissionService` se inyecta como propiedad **pública** del componente.

La directiva estructural `*wpHasPermission` (`@app/shared/general/directives/has-permission.directive`) existe y acepta
rol (`'FeEcAdmin'`), array de roles, `{ resource, permission }` o `{ role }`, pero casi no se usa. Prefiere `@if` + `canX()`
para ser coherente con el resto del repo.

## Guards de ruta (`src/app/core/guard/`)

Funcionales (`CanActivateFn`): `authGuard`, `adminRouteGuard`, `wpAdminOnlyRouteGuard`, `usuarioRouteGuard`,
`clientRoleGuard`, `notFoundGuard`. `authGuard` siempre primero en `canActivate`. Sin llamadas HTTP dentro de un guard.

## Reglas

- Oculta (no solo deshabilites) las acciones que el usuario no puede ejecutar.
- La UI no es la seguridad: el backend valida igual; no confíes en el ocultamiento.
- No dupliques lógica de permisos en el componente (nada de `roles.includes('Admin')` a mano): usa el servicio.
