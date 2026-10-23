# Errores y excepciones

Clases en `05-<Api>.Common/Exceptions/`. Si el repo tiene una guía propia (p. ej. `ExceptionHandlingGuide.md`), manda ella.

## Jerarquía y mapeo HTTP

```
BaseException(errorCode, technicalMessage, userMessage, severity) + .WithMetadata(key, value)
├── DomainException
│   ├── EntityNotFoundException          404
│   ├── DuplicateEntityException         409
│   ├── BusinessRuleViolationException   422
│   └── InvalidEntityStateException      422
├── ValidationException                  400
└── InfrastructureException              500 (no mapeadas)
    ├── DatabaseConnectionException, RepositoryException
    └── ExternalServiceException
```

| Excepción | Constructor |
|---|---|
| `ValidationException` | `(fieldName, errorMessage)` / `(fieldName, List<string>)` |
| `EntityNotFoundException` | `(entityName, id)` / `(entityName, fieldName, fieldValue)` |
| `DuplicateEntityException` | `(entityName, fieldName, fieldValue)` |
| `BusinessRuleViolationException` | `(ruleName, ruleDescription, userMessage[, messageCodes])` — `userMessage` va tal cual al usuario |
| `InvalidEntityStateException` | `(entityName, entityId, currentState, attemptedOperation)` |
| `ExternalServiceException` | `(serviceName, endpoint, technicalMessage, httpStatusCode?, inner?)` |

El mapeo está en `Program.cs` de cada host (`app.UseWebPOSExceptionHandler(o => o.Map<…>(status, title, ProblemTypeUris.X))`)
y produce `ProblemDetails`. **Si creas una excepción nueva, mapéala en todos los hosts que puedan lanzarla.**

`ValidationException` choca con `System.ComponentModel.DataAnnotations`: usa el alias
`using PortalValidationException = <Api>.Common.Exceptions.ValidationExceptions.ValidationException;`.

## Mensajes al usuario: `ErrorMessages.json`

`05-…/Resources/ErrorMessages.json` (recurso embebido), leído por `ErrorMessageCatalog.Get(errorCode, sección)`:

1. Busca `errorCode` en la sección indicada; 2. si no, en `COMMON`; 3. si no, devuelve **"Ha ocurrido un error inesperado."**

Las excepciones arman código y sección a partir del `entityName`:
- `EntityNotFoundException(entityName, …)` → código `<ENTITYNAME>_NOT_FOUND`, sección `<ENTITYNAME>`.
- `DuplicateEntityException(entityName, field, …)` → código `<ENTITYNAME>_DUPLICATE_<FIELD>`, sección `<ENTITYNAME>`.
- `CrudService` lanza `EntityNotFoundException(typeof(TEntity).Name, id)`: la sección es el **nombre de la clase de la
  entidad** (no el de la pantalla). `COMMON` no tiene `<X>_NOT_FOUND` genérico, así que **cada entidad necesita su
  `<ENTIDAD>_NOT_FOUND`** o el usuario verá el mensaje de error inesperado.

```json
"ITEM": {
  "screen": "Ítem",
  "path": "/admin/item",
  "errors": {
    "ITEM_NOT_FOUND": "El ítem solicitado no existe.",
    "ITEM_DUPLICATE_CODE": "Ya existe un ítem con este código."
  }
}
```

- Si una pantalla trabaja sobre la entidad de otra (p. ej. un rol sobre una tabla compartida), los 404 de la base usan la
  sección de la **entidad**; las excepciones que lances tú deben usar un `entityName` coherente (todas con el de la entidad,
  o todas con el de la pantalla y su sección completa). No mezcles.
- Mensajes en español, para el usuario final, sin detalles técnicos; el detalle va en `technicalMessage`/metadata (logs).

## Reglas

- Nunca `throw new Exception(...)`: usa la excepción específica.
- Nunca devuelvas `null` desde un servicio cuando se espera un objeto: `EntityNotFoundException`.
- Duplicados: verifica antes de insertar (`AnyAsync`) → `DuplicateEntityException`, con índice `UNIQUE` en BD como respaldo.
- Reglas de negocio (límite del plan, estado no permitido) → `BusinessRuleViolationException` con mensaje claro.
- No captures `BaseException` para relanzarla ni envuelvas todo en `try/catch`: deja que suba al middleware.
- Nunca `catch { }` vacío. Si capturas para degradar con elegancia (servicio externo opcional), registra el error o
  explica en un comentario por qué se ignora.
- Errores de servicios externos → `ExternalServiceException` con el nombre del servicio y el endpoint.
- `ErrorSeverity`: `Information` (flujo normal: 404/409), `Warning` (recuperable / negocio), `Error`, `Critical` (solo fallos de sistema).
- Validaciones de parámetros de consulta en controllers: textos de `01-…/Code/ErrorMessages.cs`.
