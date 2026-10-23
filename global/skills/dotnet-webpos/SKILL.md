---
name: dotnet-webpos
description: Estándares .NET de WebPOS para cualquier API backend de la empresa — capas numeradas 01-08, WebPOS.Infrastructure.Base (AuditEntity, ISoftDeleted, IUnitOfwork, SeekPager), CrudService/TenantCrudService, DTOs Create/Update con DataAnnotations, controllers api/v1 con [Authorize] + [RequirePermission] + atributos de rol, excepciones de dominio con ErrorMessages.json, logging por categorías, EF Core + MySQL y tests xUnit con SQLite en memoria. Uso interno — la precargan los agentes backend-dotnet y code-review; no es para invocarla a mano.
user-invocable: false
---

# dotnet-webpos — normas .NET de WebPOS

Esta skill es un **índice**: lee solo las referencias que toque la tarea.

## Orden de autoridad

1. **El código del repo** (y sus documentos de arquitectura). Abre la pieza vecina más parecida y copia su forma.
2. **La skill de contexto del proyecto** (`.claude/skills/<repo>-contexto/` dentro del repo, p. ej. `wpapi-contexto`):
   nombres reales, entidades de referencia, comandos, deuda conocida que no se debe copiar.
3. **Esta skill**: la norma de empresa cuando el repo no lo resuelve o tiene variantes.
4. Conocimiento general de .NET, solo si nada de lo anterior aplica.

Si el repo contradice esta norma en código **legado**, no lo "arregles" de paso en una feature; sigue la norma en lo nuevo y
anótalo como deuda. Si la contradicción es reciente y consistente, manda el repo: avisa para actualizar esta skill.

En los ejemplos, `<Api>` es el prefijo de la solución (p. ej. `01-<Api>.API`, `05-<Api>.Common`).

## Qué leer según la tarea

| Si la tarea toca… | Lee |
|---|---|
| Dónde va cada cosa, receta de entidad nueva de punta a punta | `references/arquitectura.md` |
| Controller, ruta, verbo HTTP, códigos de respuesta, Swagger | `references/api.md` |
| Quién puede llamar un endpoint (roles, permisos, empresa) | `references/seguridad.md` |
| Servicio, `CrudService`/`TenantCrudService`, reglas de negocio, DTOs, registro DI | `references/servicios.md` |
| Entidad, `DbContext`, configuración EF, migración, consultas, `WebPOS.Infrastructure.Base` | `references/base-de-datos.md` |
| Excepciones, códigos de error, `ErrorMessages.json` | `references/errores.md` |
| Logs, auditoría de acciones, configuración | `references/logging-config.md` |
| Tests | `references/testing.md` |

## Plantilla de CRUD nuevo

`assets/plantilla-entidad/` trae una feature completa y limpia (entidad `Item`): entidad, configuración EF, DTOs,
interfaz, servicio, registro DI, controller, entrada de `ErrorMessages.json` y test. Su `README.md` dice qué renombrar
y dónde va cada archivo. Úsala en vez de copiar una feature real del repo (las reales arrastran deuda); después contrasta
con la entidad de referencia que indique la skill de contexto.

## Reglas que no se negocian

- Capas: `API → Services → Infraestructure → Data`; `Common` lo usan todos. Nunca una capa inferior referencia a una superior.
- Controllers delgados: DTOs siempre, `[Authorize]` en la clase, `[RequirePermission]` + atributo de rol en cada acción
  (excepciones legítimas en `seguridad.md`), `CancellationToken` propagado, 201/204, XML docs.
- **Ningún `Update*Dto` expone `CompanyLicCod`** (permitiría mover un registro a otra empresa). Añade cada `Update*Dto`
  nuevo al test guardián del repo (`UpdateDtoNoExponeCompanyLicCodTest` o equivalente). `check-backend.js` lo marca como ERROR.
- Reglas de negocio en el servicio; errores con excepciones de dominio, nunca `throw new Exception` ni `catch {}`.
- Unicidad: chequeo en servicio **y** índice único `UX_…` (incluye `IsDeleted`) en BD.
- `async` de punta a punta: sin `.Result`, `.Wait()`, `async void`.
- Secretos fuera del repo. Logs estructurados, sin datos sensibles.
- Commits: uno por funcionalidad, con tests. Respeta la política de trailers del repo (algunos prohíben `Co-Authored-By`;
  lo dice la skill de contexto).

## Validación obligatoria antes de terminar

Desde la raíz de la solución:

```bash
node "$HOME/.claude/skills/dotnet-webpos/scripts/check-backend.js" <archivos o carpetas tocados>
dotnet build <Solucion>.sln
dotnet test <proyecto de tests> --filter "FullyQualifiedName~<Clase>Test"
```

Si cambiaste entidades o configuración EF, comprueba que no falta migración (comando exacto en la skill de contexto).

`check-backend.js` (sin rutas revisa toda la solución; con rutas, solo esas) marca:
- **ERROR**: controller de `01-*.API` sin `[Authorize]`/`[AllowAnonymous]`; `throw new Exception`; `catch` vacío;
  `.Result` (tras `)` o sobre una variable Task), `.Wait()`, `GetAwaiter().GetResult()`, `async void`; SQL crudo
  interpolado; **clases** `*Service` de `Services.Data` sin registrar (no revisa interfaces sueltas); `Update*Dto` con `CompanyLicCod`.
- **AVISO**: acción de `Controllers/v<N>` sin `[RequirePermission]` (no avisa con `[GlobalAdminOnly]`) o sin atributo de rol
  (`[GlobalAdminOnly]` no cuenta: es solo metadata); acción async o que devuelve `Task` sin `CancellationToken`, salvo
  que solo delegue en `GetByIdAsync`/`GetAllAsync`/`GetEntityByFilter`; bloqueos en código de arranque; entidad sin `DbSet`.

Un AVISO en código que no tocaste suele ser deuda conocida (ver skill de contexto); en código nuevo, corrígelo o
justifícalo en el resumen.
