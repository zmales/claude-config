# Tests

- **xUnit v3** + Moq + MockQueryable. Proyectos en `06-WPApiPortalFeEc.UnitTest/`: `PortalFeEc.UnitTest.Services.Data`
  (servicios), `.Services.SRI`, `.Infraestructure`, `.Soap`, `.WPApiFeEc.Api` (controllers/filtros/middleware B2B).
- Servicios: `PortalFeEc.UnitTest.Services.Data/Test.Service/<Entidad>ServiceTest.cs`. Referencia: `CarrierServiceTest.cs`.
- **BD de prueba: SQLite en memoria** (`BaseIntegrations/TestDbContextFactory`), con la configuración MySQL real y el
  interceptor de auditoría. No uses `UseInMemoryDatabase` para tests nuevos: SQLite respeta índices únicos y relaciones.
- Helpers: `MockCurrentUserHelper`, `MockCompanyRoleVerifierHelper`, `TestLoggerProvider`; fixtures genéricas en `Fixtures/`.
- Ejecutar: `dotnet test 06-WPApiPortalFeEc.UnitTest/PortalFeEc.UnitTest.Services.Data --filter "FullyQualifiedName~CarrierServiceTest"`.

## Plantilla

```csharp
/// <summary>Pruebas de <see cref="CarrierService"/>: qué comportamiento cubren y por qué.</summary>
public class CarrierServiceTest
{
    #region Private properties
    private readonly TestDbContextFactory _factory;
    private readonly PortalFeContext _context;
    private readonly UnitOfWork<PortalFeContext> _unitOfWork;
    #endregion

    #region Constructor
    public CarrierServiceTest()
    {
        _factory = new TestDbContextFactory();
        _context = _factory.CreateContext(_factory.defaultConnectionString);
        _unitOfWork = new UnitOfWork<PortalFeContext>(_context);
    }
    #endregion

    #region Helpers
    private CarrierService NewService() =>
        new(_unitOfWork, new MockCurrentUserHelper(), NullLoggerFactory.Instance, new MockCompanyRoleVerifierHelper());
    #endregion

    #region Test
    [Fact(DisplayName = "CreateAsync_ShouldNormalizePlate: La placa se guarda sin espacios y en mayúsculas")]
    public async Task CreateAsync_ShouldNormalizePlate()
    {
        // Arrange
        var service = NewService();
        // Act
        var id = await service.CreateAsync(NewCarrierDto("LICCR002", "0990000002001", plate: " pbx 1234 "),
                                           TestContext.Current.CancellationToken);
        // Assert
        var carrier = await _context.Client.FindAsync(id);
        Assert.Equal("PBX1234", carrier!.LicensePlate);
    }
    #endregion
}
```

## Convenciones

- Nombre del método `Metodo_ShouldResultado` y `DisplayName` = `"<nombre>: <frase en español del comportamiento>"`.
- Patrón Arrange / Act / Assert. Un comportamiento por test. Sin dependencia de orden ni estado compartido mutable
  (cada clase crea su propia BD en memoria; usa `CompanyLicCod` distintos por test si comparten clase).
- `TestContext.Current.CancellationToken` (xUnit v3) para los `CancellationToken`.
- Errores: `await Assert.ThrowsAsync<DuplicateEntityException>(() => service.CreateAsync(dto, ct));`
- Mockea solo dependencias externas (correo, SRI, licencias, HTTP); la BD se prueba con SQLite real.
  Si necesitas muchos mocks, la clase tiene demasiadas dependencias.
- Sin tests comentados ni `Skip`. No hagas commit que rompa tests existentes.

## Qué probar

- Reglas de negocio del servicio (duplicados, límites del plan, normalizaciones, cascadas).
- Validaciones de DTO (`ValidationException`) y casos borde.
- Alcance por empresa / propiedad cuando el servicio tiene lógica propia (ver `CrudServiceCompanyScopeTest`).
- Que el borrado sea lógico cuando corresponde.
- No pruebes EF ni el framework, ni getters triviales.

## Tests guardianes existentes (no los rompas)

- `ServiceDataRegistrationTest`: todo lo que necesitan los servicios se registra en `AddServicesData()` (lo llaman Portal, B2B y SOAP).
- `UpdateDtoNoExponeCompanyLicCodTest`: ningún `Update*Dto` puede exponer `CompanyLicCod` (seguridad, ver `seguridad.md`).
