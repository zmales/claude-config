# Logging, auditoría y configuración

Guía completa en el repo: `LoggingGuide.md` y la sección 10 de `ARCHITECTURE_DECISIONS_V1.md` (ADR-013).

## Logging

- Se configura una sola vez con `builder.Logging.AddWPLogging(builder.Configuration)` (`Extensions/LoggingExtensions.cs`).
  No configures proveedores de log a mano.
- Usa `ILogger<T>` inyectado o `ILoggerFactory.CreateLogger("<Categoría>." + nombre)`.
- **El prefijo de la categoría decide a qué tabla de BD va el log**:

| Categoría | Destino | Uso |
|---|---|---|
| `Portal.` | `PortalActionLog` | Acciones de usuarios en el portal (alta/edición/baja). `CrudService` ya lo hace solo. |
| `Sri.` | `SriTraceabilityLog` | Trazabilidad con el SRI (envío, autorización, consultas) |
| `Events.` | `SystemEventLog` | Eventos de sistema y jobs (Hangfire) |
| `B2BApi.` | `ApiB2BRequestLog` | Requests de la API B2B |
| `Auth.` | `AuthFailureLog` | Fallos de autenticación |
| cualquier otra (p. ej. `ILogger<BranchService>`) | Log técnico (consola/archivo) | Diagnóstico |

- **Logging estructurado** con plantillas, nunca interpolación:
  `_logger.LogInformation("Sucursal {BranchCod} creada para {CompanyLicCod}", dto.BranchCod, dto.CompanyLicCod);`
- Niveles: `Information` para hitos de negocio, `Warning` para situaciones recuperables, `Error` con la excepción
  (`_logger.LogError(ex, "…")`) cuando capturas algo que no relanzas. Los errores no manejados ya los registra el middleware.
- Llamadas a servicios externos (SRI, licencias, correo): registra inicio, resultado y error.
- **Nunca registres** contraseñas, tokens, API keys, certificados, connection strings ni cuerpos de request con datos sensibles.
- `BeginScope` para añadir contexto (empresa, documento) a varios logs seguidos.

## Auditoría de acciones

`CrudService`/`TenantCrudService` registran Create/Update/Delete en `Portal.` con valores anteriores y nuevos.
- Excluye campos sensibles o ruidosos sobrescribiendo `GetAuditExcludedProperties(entity)`.
- Desactiva con `AuditPortalActions => false` solo si la entidad ya tiene su propia trazabilidad (como `FiscalDocService`).
- En métodos propios que modifican datos, llama a `LogPortalAction("Update", entity, snapshot)` (captura antes con `CaptureAuditSnapshot`).

## Configuración

| Fuente | Qué va ahí |
|---|---|
| `Shared/appsettings.Shared.json` | Constantes de plataforma comunes a las 3 APIs. Se carga primero. |
| `appsettings.json` / `appsettings.{Environment}.json` de cada API | Lo propio de cada API; sobrescribe a Shared. |
| Variables de entorno / secretos del despliegue | Cadenas de conexión, claves, contraseñas. **Nunca en el repo.** |
| Tabla `Config` (`ConfigTypes`) | Configuración de negocio editable: valor global con `CompanyLicCod = "SYSTEM"` y override por empresa. Tipos `Dft*` = canónicos. |
| `Config` con `ConfigType = Agent` (`AgentCfg`, ADR-011) | Configuración de emisión por punto de emisión. Se resuelve **solo** con `IAgentCfgResolver` (cascada empresa → SYSTEM). |
| Ajustes de empresa | Endpoint unificado `Company/{licCod}/settings` (`ICompanySettingsService`). |

- Clases de opciones tipadas en `05-…Common/Config/` (`LicenseServiceOptions`, `SriJobPollingOptions`…). Para un valor nuevo
  de plataforma, crea o extiende una clase de opciones en lugar de leer `IConfiguration` suelto en un servicio.
- Un tipo de configuración nuevo en BD: constante en `ConfigTypes` + entrada en `ConfigTypeCatalog`.
- Caché: claves en `Constants/CacheKeys.cs`; invalida la caché cuando cambies el dato que cachea.
- Trabajos en segundo plano: Hangfire, aislado según el ADR (sección 7). Nunca lances trabajo largo desde un endpoint sin pasar por un job.
