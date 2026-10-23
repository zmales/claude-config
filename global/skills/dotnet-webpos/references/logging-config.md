# Logging, auditoría y configuración

Si el repo tiene `LoggingGuide.md` o un ADR de logging, manda él.

## Logging (WebPOS.Logger)

- Se configura una sola vez por host con `builder.Logging.AddWPLogging(builder.Configuration)` (`Extensions/LoggingExtensions.cs`).
  No añadas proveedores de log a mano.
- Usa `ILogger<T>` inyectado, o `ILoggerFactory.CreateLogger("<Prefijo>." + nombre)` cuando el destino importa.
- **El prefijo de la categoría decide a qué BD/tabla de log va** (además de consola, que recibe todas):

| Categoría | Destino | Uso |
|---|---|---|
| `Portal.` | `PortalActionLog` | Acciones de usuarios (alta/edición/baja). `CrudService` ya lo hace solo. |
| `Sri.` | `SriTraceabilityLog` | Trazabilidad con la autoridad tributaria |
| `Events.` | `SystemEventLog` | Eventos de sistema y jobs |
| `B2BApi.` | `ApiB2BRequestLog` | Requests de la API de integración |
| `Auth.` | `AuthFailureLog` | Fallos de autenticación |
| cualquier otra (p. ej. `ILogger<ItemService>`) | **`TechnicalLog` en BD + consola** | Diagnóstico técnico |

  No existe log a archivo (`FileLoggerProvider` se retiró); no lo reintroduzcas. Los hosts pueden tener tablas propias
  adicionales (p. ej. requests SOAP): ver la skill de contexto.
- **Logging estructurado** con plantillas, nunca interpolación:
  `_logger.LogInformation("Ítem {Code} creado para {CompanyLicCod}", dto.Code, dto.CompanyLicCod);`
- Niveles: `Information` para hitos de negocio, `Warning` para lo recuperable, `Error` con la excepción
  (`_logger.LogError(ex, "…")`) cuando capturas algo que no relanzas. Los no manejados ya los registra el middleware.
- Llamadas a servicios externos: registra inicio, resultado y error.
- **Nunca registres** contraseñas, tokens, API keys, certificados, connection strings, datos personales completos ni
  cuerpos de request con datos sensibles. Nunca `Console.WriteLine`.
- `BeginScope` para añadir contexto (empresa, documento) a varios logs seguidos.
- Salud: los hosts exponen `/health/live` y `/health/ready` (`MapHealthChecks`); un check nuevo va en `AddHealthChecks()`.

## Auditoría de acciones

`CrudService`/`TenantCrudService` registran Create/Update/Delete en `Portal.` con valores anteriores y nuevos.
- Excluye campos sensibles o ruidosos sobrescribiendo `GetAuditExcludedProperties(entity)`.
- Desactiva con `AuditPortalActions => false` solo si la entidad ya tiene su propia trazabilidad de negocio.
- En métodos propios que modifican datos: `CaptureAuditSnapshot` antes de mutar y `LogPortalAction("Update", entity, snapshot)` después.

## Configuración

| Fuente | Qué va ahí |
|---|---|
| `appsettings` compartido de la solución (si existe) | Constantes de plataforma comunes a todos los hosts. Se carga primero. |
| `appsettings.json` / `appsettings.{Environment}.json` de cada host | Lo propio de cada host; sobrescribe al compartido. |
| Variables de entorno / secretos del despliegue | Cadenas de conexión, claves, contraseñas. **Nunca en el repo.** |
| Tabla `Config` (tipos en `ConfigTypes`) | Configuración de negocio editable: valor global con `CompanyLicCod = "SYSTEM"` y override por empresa. |

- Clases de opciones tipadas en `05-…/Config/`. Para un valor nuevo de plataforma, crea o extiende una clase de opciones en
  vez de leer `IConfiguration` suelto en un servicio.
- Tipo de configuración nuevo en BD: constante en `ConfigTypes` + su entrada en el catálogo de tipos.
- Caché: claves centralizadas (`Constants/CacheKeys.cs`); invalida la caché cuando cambies el dato que cachea.
- Trabajo en segundo plano: Hangfire, según el ADR del repo. Nunca lances trabajo largo desde un endpoint sin un job.
