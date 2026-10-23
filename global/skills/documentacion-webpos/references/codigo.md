# Documentación en código (C# y TypeScript)

Norma extraída del estilo real de `WPApiPortalFeEc` (controllers, `API/Code/*`, servicios) y de los
servicios de `core/services` del portal Angular. Todo en español.

## Principio

El código debe entenderse solo. Un comentario existe para contar lo que el código **no** puede decir:
la regla de negocio, la restricción externa (SRI, multi-tenant, seguridad), la alternativa descartada
o el motivo de un comportamiento sorprendente.

### Cuándo SÍ documentar

- Contratos públicos: controllers y sus acciones, interfaces de servicio, servicios Angular
  compartidos, DTOs con campos no obvios.
- Reglas de negocio y restricciones (p. ej. "el filtro de rol vive en el servicio, no aquí, para que
  no pueda omitirse por descuido").
- Decisiones de seguridad o de resiliencia ("nunca se expone el mensaje real de la excepción…").
- Comportamiento sorprendente o deliberadamente distinto a lo habitual ("SIEMPRE responde 200 OK…").
- Workarounds, con la tarea o el hallazgo que los origina.

### Cuándo NO

- Repetir lo que el nombre ya dice: `/// <summary>Obtiene el id.</summary>` sobre `GetId()`,
  `// incrementa i`.
- Getters/setters triviales, métodos privados obvios, constructores (basta `/// <summary>Constructor.</summary>`
  si el compilador exige doc).
- Código comentado "por si acaso": se borra; git lo guarda.
- Comentarios que dependen de un estado temporal ("de momento", "por ahora") sin tarea asociada.

## C# — XML docs (`///`)

Los proyectos API tienen `<GenerateDocumentationFile>true</GenerateDocumentationFile>`, así que los
miembros públicos sin `///` generan warning: documenta lo público.

| Etiqueta | Uso en WebPOS |
|---|---|
| `<summary>` | Una o dos frases: qué es y para qué sirve. En una línea si cabe. |
| `<remarks>` | El porqué: contexto, TASK/ADR, alternativas descartadas, alcance. Aquí va lo valioso. |
| `<param>` / `<returns>` | Cuando el valor no es obvio (formatos, nulos, unidades, qué pasa si no existe). |
| `<exception cref>` | Excepciones de dominio que el llamador debe esperar. |
| `<see cref>` / `<paramref>` / `<c>` | Referencias cruzadas a tipos, parámetros y literales (`<c>200 OK</c>`, `<c>IsCarrier</c>`). |
| `<inheritdoc />` | En la implementación de una interfaz ya documentada. No repitas el texto. |

En acciones de controller se añade debajo del bloque `///` un comentario con la ruta, seguido de los
atributos `[ProducesResponseType]` que documentan los códigos HTTP para Swagger:

```csharp
/// <summary>
/// Obtiene un transportista por su identificador.
/// </summary>
/// <param name="id">Identificador del transportista.</param>
/// <returns>El <c>CarrierDto</c> correspondiente o 404 si no existe o no es transportista.</returns>
// GET: api/v1/carrier/{id}
[HttpGet("{id:int}")]
[RequirePermission(PermissionAction.Read)]
[ProducesResponseType(StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<ActionResult<CarrierDto>> GetById(int id)
```

Clase con contexto de diseño en `<remarks>`:

```csharp
/// <summary>
/// Controlador para la gestión de transportistas.
/// </summary>
/// <remarks>
/// Los transportistas comparten tabla con clientes y proveedores (<c>Customer</c>): son la misma
/// contraparte con la bandera <c>IsCarrier</c> activa. El filtro de rol vive en
/// <see cref="ICarrierService{TEntity,TKey,TDto,TCreateDto,TUpdateDto}"/>, no aquí, para que no
/// pueda omitirse por descuido.
/// </remarks>
```

## TypeScript — JSDoc (`/** */`)

- Servicios compartidos (`core/services`, `BaseService`, API services), utilidades, guards,
  interceptores y stores: JSDoc en métodos públicos.
- Primera línea en tercera persona e indicativo: "Realiza una petición GET al API", "Obtiene la URL
  base según el tipo de API".
- `@param nombre - descripción` (con guion), con ejemplos de valor si ayudan:
  `@param endpoint - Endpoint relativo (ej: 'products' o 'products/123')`.
- `@returns` solo si el retorno no es evidente por el tipo; `@throws` si el método lanza.
- Componentes: JSDoc en la clase solo si es reutilizable (inputs/outputs no obvios); un `@example`
  con el selector HTML es útil en componentes compartidos.
- Interfaces/DTOs: `/** */` en la propiedad solo cuando el nombre no basta (unidades, formato SRI,
  códigos).
- No repitas los tipos en el JSDoc: TypeScript ya los declara.

```ts
/**
 * Realiza una petición GET al API
 * @param endpoint - Endpoint relativo (ej: 'products' o 'products/123')
 * @param apiType - Tipo de API ('data' | 'auth')
 * @param options - Opciones adicionales de HttpClient
 */
get<T>(endpoint: string, apiType: ApiType = 'data', options?: object): Observable<T>
```

## Comentarios en línea

Explican una línea o bloque concreto cuyo motivo no es evidente:

```csharp
// Sin request HTTP en curso no hay usuario del cual derivar un alcance (jobs de Hangfire, …)
// Hallazgo de exposición pública (2026-09-18): sin esto, este endpoint administrativo …
```

Marcadores de deuda técnica, siempre con responsable o tarea:

```
// TODO(usuario): descripción. TASK-123
// HACK: motivo. TASK-456 para quitarlo
// FIXME: bug conocido. TASK-789
```

## Checklist

- [ ] ¿Lo público (controllers, interfaces, servicios compartidos) tiene `///` o `/** */`?
- [ ] ¿El `<remarks>`/comentario explica el porqué y cita TASK/ADR cuando aplica?
- [ ] ¿Ningún comentario repite lo que ya dice el código?
- [ ] ¿Sin código comentado y sin TODO huérfanos?
- [ ] ¿Todo en español y coherente con el comportamiento actual?
