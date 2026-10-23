# Tests

- **xUnit v3** + Moq + MockQueryable. Un proyecto de tests por proyecto probado en `06-<Api>.UnitTest/`.
- Servicios: `…UnitTest.Services.Data/Test.Service/<Entidad>ServiceTest.cs`. Plantilla: `assets/plantilla-entidad/ItemServiceTest.cs`.
- **BD de prueba: SQLite en memoria** (`BaseIntegrations/TestDbContextFactory`), con la configuración MySQL real y el
  interceptor de auditoría. No uses `UseInMemoryDatabase` en tests nuevos: SQLite respeta índices únicos y relaciones.
- Helpers: `MockCurrentUserHelper`, `MockCompanyRoleVerifierHelper`, `TestLoggerProvider`; fixtures genéricas en `Fixtures/`.
- Ejecutar: `dotnet test <proyecto> --filter "FullyQualifiedName~ItemServiceTest"`.

## Forma

```csharp
/// <summary>Pruebas de <see cref="ItemService"/>: qué comportamiento cubren y por qué.</summary>
public class ItemServiceTest
{
    #region Private properties
    private readonly TestDbContextFactory _factory;
    private readonly CatalogContext _context;
    private readonly UnitOfWork<CatalogContext> _unitOfWork;
    #endregion

    public ItemServiceTest()
    {
        _factory = new TestDbContextFactory();
        _context = _factory.CreateContext(_factory.defaultConnectionString);
        _unitOfWork = new UnitOfWork<CatalogContext>(_context);
    }

    private ItemService NewService() =>
        new(_unitOfWork, new MockCurrentUserHelper(), NullLoggerFactory.Instance, new MockCompanyRoleVerifierHelper());

    [Fact(DisplayName = "CreateAsync_ShouldRejectDuplicateCode: No permite dos ítems con el mismo código en la empresa")]
    public async Task CreateAsync_ShouldRejectDuplicateCode()
    {
        // Arrange
        var service = NewService();
        var ct = TestContext.Current.CancellationToken;
        await service.CreateAsync(NewDto("LIC001", "A1"), ct);
        // Act + Assert
        await Assert.ThrowsAsync<DuplicateEntityException>(() => service.CreateAsync(NewDto("LIC001", "A1"), ct));
    }
}
```

## Convenciones

- Método `Metodo_ShouldResultado` y `DisplayName = "<nombre>: <frase en español del comportamiento>"`.
- Arrange / Act / Assert. Un comportamiento por test. Sin dependencia de orden ni estado compartido mutable (cada clase crea
  su BD en memoria; usa `CompanyLicCod` distintos por test si comparten clase).
- `TestContext.Current.CancellationToken` (xUnit v3) para los `CancellationToken`.
- Mockea solo dependencias externas (correo, autoridad tributaria, licencias, HTTP); la BD se prueba con SQLite real.
  Si necesitas muchos mocks, la clase tiene demasiadas dependencias.
- Sin tests comentados ni `Skip`. No hagas commit que rompa tests existentes.

## Qué probar

- Reglas de negocio del servicio (duplicados, límites, normalizaciones, cascadas).
- Validaciones de DTO (`ValidationException`) y casos borde.
- Alcance por empresa / propiedad cuando el servicio tiene lógica propia.
- Que el borrado sea lógico cuando corresponde.
- No pruebes EF ni el framework, ni getters triviales.

## Tests guardianes (no los rompas; amplíalos)

- `ServiceDataRegistrationTest`: lo que necesitan los servicios se registra en `AddServicesData()` (lo llaman todos los hosts).
- `UpdateDtoNoExponeCompanyLicCodTest`: es un `[Theory]` sobre una **lista fija** de tipos; un `Update*Dto` nuevo no queda
  cubierto hasta que lo añades a `UpdateDtoTypes`. **Norma: cada `Update*Dto` nuevo se añade a esa lista** (y
  `check-backend.js` lo vigila en todos los DTOs).
