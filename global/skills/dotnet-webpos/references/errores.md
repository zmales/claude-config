# Errores y excepciones

Guía completa en el repo: `ExceptionHandlingGuide.md`. Clases en `05-WPApiPortalFeEc.Common/Exceptions/`.

## Jerarquía y mapeo HTTP

`BaseException(errorCode, technicalMessage, userMessage, severity)` + `.WithMetadata(key, value)`.

| Excepción | Constructor | HTTP |
|---|---|---|
| `ValidationExceptions.ValidationException` | `(fieldName, errorMessage)` / `(fieldName, List<string>)` | 400 |
| `DomainExceptions.EntityNotFoundException` | `(entityName, id)` / `(entityName, fieldName, fieldValue)` | 404 |
| `DomainExceptions.DuplicateEntityException` | `(entityName, fieldName, fieldValue)` | 409 |
| `DomainExceptions.BusinessRuleViolationException` | `(ruleName, ruleDescription, userMessage[, messageCodes])` | 422 |
| `DomainExceptions.InvalidEntityStateException` | — | 422 |
| `InfrastructureExceptions.ExternalServiceException` | `(serviceName, endpoint, technicalMessage, httpStatusCode?, inner?)` | 500 (no mapeada) |
| `InfrastructureExceptions.DatabaseConnectionException`, `RepositoryException` | — | 500 (no mapeada) |

El mapeo está en `Program.cs` (`app.UseWebPOSExceptionHandler(options => options.Map<…>(status, title, ProblemTypeUris.X))`)
y produce `ProblemDetails`. **Si creas una excepción nueva, mapéala ahí** (y en las otras APIs si también la lanzan).

En servicios, `ValidationException` choca de nombre con `System.ComponentModel.DataAnnotations`: usa el alias del repo
`using PortalValidationException = WPApiPortalFeEc.Common.Exceptions.ValidationExceptions.ValidationException;`.

## Mensajes al usuario: `ErrorMessages.json`

`05-WPApiPortalFeEc.Common/Resources/ErrorMessages.json`, leído por `ErrorMessageCatalog.Get(errorCode, screen)`:

```json
"CARRIER": {
  "screen": "Transportista",
  "path": "/admin/carrier",
  "errors": {
    "CARRIER_NOT_FOUND": "El transportista solicitado no existe.",
    "CARRIER_DUPLICATE_IDNUMBER": "Ya existe un transportista registrado con esta identificación."
  }
}
```

- `EntityNotFoundException("Carrier", id)` busca `CARRIER_NOT_FOUND` en la sección `CARRIER`, luego en `COMMON`.
- `DuplicateEntityException("Carrier", "IdNumber", valor)` busca `CARRIER_DUPLICATE_IDNUMBER`.
- Por eso: **el `entityName` que pasas define la sección y el código**. Para una pantalla nueva, añade su sección con
  `screen`, `path` (ruta del front) y los códigos que vas a lanzar. Si falta, cae en el mensaje genérico de `COMMON`.
- Mensajes en español, para el usuario final, sin detalles técnicos. El detalle va en `technicalMessage`/metadata (logs).

## Reglas

- Nunca `throw new Exception(...)`: usa la excepción específica.
- Nunca devuelvas `null` desde un servicio cuando se espera un objeto: `EntityNotFoundException`.
- Duplicados: verifica antes de insertar (`AnyAsync`) → `DuplicateEntityException`, con índice `UNIQUE` en BD como respaldo.
- Reglas de negocio (límite del plan, estado no permitido) → `BusinessRuleViolationException` con mensaje claro.
- No captures `BaseException` para relanzarla ni envuelvas todo en `try/catch`: deja que suba al middleware.
- Nunca `catch { }` vacío. Si capturas para degradar con elegancia (p. ej. un servicio externo opcional), registra el error.
- Errores de servicios externos (SRI, licencias, correo) → `ExternalServiceException` con el nombre del servicio y endpoint.
- `ErrorSeverity.Critical` solo para fallos de sistema, nunca para errores de negocio.
- Validaciones de parámetros de consulta en controllers: textos de `01-…API/Code/ErrorMessages.cs`.
