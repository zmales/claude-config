using Microsoft.Extensions.Logging.Abstractions;
using PortalFeEc.UnitTest.Services.Data.BaseIntegrations;
using WebPOS.Infrastructure.Base.UnitOfWork;
using WPApiPortalFeEc.Common.Dto.Item;
using WPApiPortalFeEc.Common.Exceptions.DomainExceptions;
using WPApiPortalFeEc.Common.Exceptions.ValidationExceptions;
using WPApiPortalFeEc.Infraestructure.Context;
using WPApiPortalFeEc.Services.Data.Services;

namespace PortalFeEc.UnitTest.Services.Data.Test.Service
{
    /// <summary>
    /// Pruebas de <see cref="ItemService"/> sobre SQLite en memoria (configuración MySQL real, índices únicos y
    /// borrado lógico incluidos): unicidad del código por empresa, validación del DTO y borrado lógico.
    /// </summary>
    public class ItemServiceTest
    {
        #region Private properties

        private readonly TestDbContextFactory _factory;
        private readonly PortalFeContext _context;
        private readonly UnitOfWork<PortalFeContext> _unitOfWork;

        #endregion

        #region Constructor

        public ItemServiceTest()
        {
            _factory = new TestDbContextFactory();
            _context = _factory.CreateContext(_factory.defaultConnectionString);
            _unitOfWork = new UnitOfWork<PortalFeContext>(_context);
        }

        #endregion

        #region Helpers

        private ItemService NewService() =>
            new(_unitOfWork, new MockCurrentUserHelper(), NullLoggerFactory.Instance, new MockCompanyRoleVerifierHelper());

        private static CreateItemDto NewDto(string companyLicCod, string code, string name = "Ítem Test") => new()
        {
            CompanyLicCod = companyLicCod,
            Code = code,
            Name = name,
        };

        #endregion

        #region Test

        [Fact(DisplayName = "CreateAsync_ShouldPersistItem: El ítem creado se recupera con sus datos")]
        public async Task CreateAsync_ShouldPersistItem()
        {
            // Arrange
            var service = NewService();
            var ct = TestContext.Current.CancellationToken;

            // Act
            var id = await service.CreateAsync(NewDto("LICIT001", "A1", "Tornillo"), ct);

            // Assert
            var dto = await service.GetByIdAsync(id);
            Assert.Equal("A1", dto.Code);
            Assert.Equal("Tornillo", dto.Name);
        }

        [Fact(DisplayName = "CreateAsync_ShouldRejectDuplicateCode: No permite dos ítems activos con el mismo código en la empresa")]
        public async Task CreateAsync_ShouldRejectDuplicateCode()
        {
            // Arrange
            var service = NewService();
            var ct = TestContext.Current.CancellationToken;
            await service.CreateAsync(NewDto("LICIT002", "A1"), ct);

            // Act + Assert
            await Assert.ThrowsAsync<DuplicateEntityException>(() => service.CreateAsync(NewDto("LICIT002", "A1"), ct));
        }

        [Fact(DisplayName = "CreateAsync_ShouldAllowSameCodeInOtherCompany: El código solo es único dentro de cada empresa")]
        public async Task CreateAsync_ShouldAllowSameCodeInOtherCompany()
        {
            // Arrange
            var service = NewService();
            var ct = TestContext.Current.CancellationToken;
            await service.CreateAsync(NewDto("LICIT003", "A1"), ct);

            // Act
            var id = await service.CreateAsync(NewDto("LICIT004", "A1"), ct);

            // Assert
            Assert.True(id > 0);
        }

        [Fact(DisplayName = "CreateAsync_ShouldRejectMissingName: Un DTO sin nombre devuelve ValidationException")]
        public async Task CreateAsync_ShouldRejectMissingName()
        {
            // Arrange
            var service = NewService();
            var ct = TestContext.Current.CancellationToken;

            // Act + Assert
            await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(NewDto("LICIT005", "A1", name: ""), ct));
        }

        [Fact(DisplayName = "DeleteAsync_ShouldSoftDeleteAndFreeCode: El borrado es lógico y permite recrear el mismo código")]
        public async Task DeleteAsync_ShouldSoftDeleteAndFreeCode()
        {
            // Arrange
            var service = NewService();
            var ct = TestContext.Current.CancellationToken;
            var id = await service.CreateAsync(NewDto("LICIT006", "A1"), ct);

            // Act
            await service.DeleteAsync(id, ct);
            var newId = await service.CreateAsync(NewDto("LICIT006", "A1"), ct);

            // Assert
            await Assert.ThrowsAsync<EntityNotFoundException>(() => service.GetByIdAsync(id));
            Assert.NotEqual(id, newId);
        }

        #endregion
    }
}
