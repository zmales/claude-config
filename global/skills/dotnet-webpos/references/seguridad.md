# Seguridad y autorización

## Autenticación

- Portal (01): OpenID Connect contra WPAuthServer (`AddWebPOSOpenId`), JWT Bearer. Pipeline en `Program.cs`:
  `UseRateLimiter → UseWebPOSCors → UseInternalOnly → UseApiKeyValidation → UseAuthentication → UseAuthFailureLogging
  → UseTenantResolution → UseAuthorization`. No reordenes este pipeline sin leer los comentarios de `Program.cs`.
- B2B (07): API Key. SOAP (08): su propia autenticación (`Auth/`).

## Modelo de roles

`01-…API/Code/AppRoles.cs`:

| Constante | Tipo | Se usa con |
|---|---|---|
| `AppRoles.WpAdmin` (`WPAdmin`), `AppRoles.WpSupport` (`WPSupport`) | Roles **globales** WebPOS (claim del token) | `[ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]` |
| `AppRoles.Admin` (`admin`), `AppRoles.User` (`user`), `AppRoles.Client` (`client`) | Roles **por empresa** (`ApplicationRol.Slug`) | `[DbRoleAccess(AppRoles.Admin)]` |

Atributos de rol apilados son **alternativas (OR)**: WPAdmin **o** admin de empresa **o** user de empresa.
`GlobalRoles` detecta los roles globales; WPSupport hereda acceso de admin de empresa salvo en endpoints con `[GlobalAdminOnly]`.

## Atributos por acción (patrón obligatorio)

```csharp
[HttpPost]
[RequirePermission(PermissionAction.Write)]                 // permiso granular (applicationrol_permissions)
[ClaimAccess(nameof(AppClaims.Role), AppRoles.WpAdmin)]    // rol global
[DbRoleAccess(AppRoles.Admin)]                              // rol en la empresa
[RequireCompanyRoleFromBody(AppRoles.Admin)]                // empresa viene en el body
```

| Atributo | Para qué |
|---|---|
| `[RequirePermission(PermissionAction.Read/Write/Delete/Export/Import)]` | Acción granular del rol del usuario en la empresa. WPAdmin/WPSupport no se restringen. Usa la empresa de la ruta (`companyLicCod`/`licCod`) o del body. |
| `[ClaimAccess(...)]` / `[DbRoleAccess(...)]` | **Quién** entra (roles). Vienen de `WebPOS.Toolkit.Web.Filters`. `[DbRoleAccess]` corre antes del model binding: solo ve la empresa si está en la ruta. |
| `[RequireCompanyRoleFromBody(roles…)]` | Cuando `CompanyLicCod` llega en el **body** (POST/PUT): exige el rol en esa empresa. Sin esto un admin de la empresa A podría crear en la B. |
| `[GlobalAdminOnly("motivo")]` | Operaciones comerciales o catálogos globales (alta/baja de empresa, planes, códigos de retención): WPSupport no hereda acceso. |

Mapeo verbo → permiso: GET `Read`, POST/PUT `Write`, DELETE `Delete`, exportar `Export`, importar `Import`.
GET por empresa suele permitir `Admin` y `User`; escrituras solo `Admin` (salvo que el negocio diga otra cosa).

## Alcance por empresa (no lo rompas)

- `CrudService.GetAllAsync` filtra automáticamente por las empresas visibles del usuario (`ICallerCompanyScope`).
- `GetByIdAsync/UpdateAsync/DeleteAsync` verifican **propiedad** (`EnsureCompanyOwnershipAsync`): si el registro es
  de otra empresa responden **404**, no 403 (no revela existencia). `OwnershipRoles` por defecto `["admin"]`;
  sobrescríbelo si el controller también permite `user`.
- Métodos propios de un servicio que reciben `companyLicCod` deben filtrar por él en la consulta.
- **Ningún `Update*Dto` expone `CompanyLicCod`**: `UpdateAsync` copia el DTO sobre la entidad por nombre de propiedad, así
  que ese campo permitiría "transferir" un registro a otra empresa. Lo vigila `UpdateDtoNoExponeCompanyLicCodTest`.
- `CompanyLicCod = "SYSTEM"` (`ConfigTypes.SystemCompany`) es el valor global por defecto, visible para todos.

## Reglas generales

- Sin SQL concatenado ni `FromSqlRaw` con interpolación: LINQ o `FromSqlInterpolated`/parámetros.
- Nunca devuelvas contraseñas, tokens, API keys, certificados ni datos internos en los DTOs.
- Secretos y certificados: nunca en código, `appsettings*.json` versionado ni en texto plano en BD (ADR).
- Mensajes de error al cliente sin detalles técnicos (el middleware se encarga, ver `errores.md`).
- CORS se configura con `UseWebPOSCors`; no uses `AllowAnyOrigin()`.
- Rate limiting ya está activo globalmente; endpoints costosos o públicos nuevos: revisa la política que les aplica.
