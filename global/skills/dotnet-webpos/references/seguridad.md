# Seguridad y autorización

## Autenticación

- APIs que consume el portal Angular: OpenID Connect contra WPAuthServer (`AddWebPOSOpenId`), JWT Bearer.
- APIs de integración: API Key (u otra propia del host). La skill de contexto dice cuál usa cada host.
- El orden del pipeline en `Program.cs` (rate limiter, CORS, red interna, API key, autenticación, logging de fallos,
  resolución de tenant, autorización) está comentado en el propio archivo: no lo reordenes sin leer esos comentarios.

## Modelo de roles

`01-…/Code/AppRoles.cs`:

| Constante | Tipo | Se usa con |
|---|---|---|
| `AppRoles.WpAdmin` (`WPAdmin`), `AppRoles.WpSupport` (`WPSupport`) | Roles **globales** WebPOS (claim del token) | `[ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]` |
| `AppRoles.Admin` (`admin`), `AppRoles.User` (`user`), `AppRoles.Client` (`client`) | Roles **por empresa** | `[DbRoleAccess(AppRoles.Admin)]` |

Atributos de rol apilados son **alternativas (OR)**: WPAdmin **o** admin de la empresa **o** user de la empresa.
WPSupport hereda el acceso de admin de empresa salvo en endpoints marcados `[GlobalAdminOnly]`.

## Atributos por acción (patrón obligatorio en controllers nuevos)

```csharp
[HttpPost]
[RequirePermission(PermissionAction.Write)]                 // permiso granular del rol en la empresa
[ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]    // rol global
[DbRoleAccess(AppRoles.Admin)]                              // rol en la empresa
[RequireCompanyRoleFromBody(AppRoles.Admin)]                // la empresa viene en el body
```

| Atributo | Para qué |
|---|---|
| `[RequirePermission(PermissionAction.Read/Write/Delete/Export/Import)]` | Acción granular del rol del usuario en la empresa (403 si no la tiene). WPAdmin/WPSupport no se restringen. Toma la empresa de la ruta (`companyLicCod`/`licCod`) o del body; sin empresa, evalúa los roles del usuario en cualquiera de sus empresas. |
| `[ClaimAccess(...)]` / `[DbRoleAccess(...)]` | **Quién** entra (roles). `[DbRoleAccess]` corre antes del model binding: solo ve la empresa si está en la ruta. |
| `[RequireCompanyRoleFromBody(roles…)]` | Cuando `CompanyLicCod` llega en el **body** (POST/PUT): exige el rol en esa empresa. Sin esto, un admin de la empresa A podría crear en la B. |
| `[GlobalAdminOnly("motivo")]` | **Solo metadata**: quita a WPSupport el acceso heredado. No autoriza ni rechaza por sí mismo; la acción sigue necesitando `[ClaimAccess]`/`[DbRoleAccess]`. |

Mapeo verbo → permiso: GET `Read`, POST/PUT `Write`, DELETE `Delete`, exportar `Export`, importar `Import`.
GET por empresa suele permitir `Admin` y `User`; escrituras solo `Admin` (salvo que el negocio diga otra cosa).

**`[RequirePermission]` es obligatorio en toda acción nueva de `Controllers/v1`.** Excepciones legítimas (justifícalas en
el XML doc o en el PR):
- Acciones con `[GlobalAdminOnly]` (operaciones comerciales sobre la empresa completa, catálogos globales que solo edita WPAdmin).
- Lecturas de **catálogos globales sin empresa** (planes, menús, códigos fiscales) que necesita cualquier usuario autenticado.
- Endpoints sobre el propio usuario (sus empresas, sus puntos de emisión) donde no hay una sección de permisos que evaluar.
- `[AllowAnonymous]` explícito (salud, callbacks públicos).

## Alcance por empresa (no lo rompas)

- `CrudService.GetAllAsync` filtra automáticamente por las empresas visibles del usuario (`ICallerCompanyScope`);
  `CompanyLicCod = "SYSTEM"` (configuración global) siempre es visible.
- `GetByIdAsync/UpdateAsync/DeleteAsync` de `CrudService` verifican **propiedad**: si el registro es de otra empresa
  responden **404**, no 403 (no revela existencia). `OwnershipRoles` por defecto `["admin"]`; sobrescríbelo si el
  controller también deja entrar a `user`.
- `TenantCrudService` **no** verifica propiedad ni filtra por empresas visibles: el aislamiento lo dan la BD resuelta por
  `companyLicCod` y los atributos del controller. Filtra siempre por `CompanyLicCod` en tus consultas.
- Métodos propios de un servicio que reciben `companyLicCod` deben filtrar por él en la consulta.
- **Ningún `Update*Dto` expone `CompanyLicCod`**: `UpdateAsync` copia el DTO sobre la entidad por nombre de propiedad, así que
  ese campo permitiría "transferir" un registro a otra empresa. El test guardián (`UpdateDtoNoExponeCompanyLicCodTest`)
  solo cubre una **lista fija** de tipos: añade ahí cada `Update*Dto` nuevo. `check-backend.js` lo verifica en todos.

## Reglas generales

- Sin SQL concatenado ni `FromSqlRaw` con interpolación: LINQ o `FromSqlInterpolated`/parámetros.
- Nunca devuelvas contraseñas, tokens, API keys, certificados ni datos internos en los DTOs. Las API keys se guardan como hash.
- Secretos y certificados: nunca en código, `appsettings*.json` versionado ni en texto plano en BD.
- Mensajes de error al cliente sin detalles técnicos (lo hace el middleware, ver `errores.md`).
- CORS con `UseWebPOSCors`; nunca `AllowAnyOrigin()`.
- Rate limiting global activo; para endpoints públicos o costosos nuevos, revisa qué política les aplica.
