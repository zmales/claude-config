// FRAGMENTO, no es un archivo compilable por sí solo.
// Pegar dentro de Configure(ModelBuilder modelBuilder) de
// 03-WPApiPortalFeEc.Infraestructure/ModelConfiguration/PortalFeMySqlModelConfiguration.cs
// y añadir en Context/PortalFeContext.cs:   public DbSet<Item> Item { get; set; }

modelBuilder.Entity<Item>(entity =>
{
    #region table
    entity.ToTable("Item");
    #endregion

    #region Keys
    entity.HasKey(e => e.Id);
    // Único por empresa entre los no eliminados: incluir IsDeleted permite recrear tras un borrado lógico.
    entity.HasIndex(e => new { e.CompanyLicCod, e.Code, e.IsDeleted }).IsUnique()
          .HasDatabaseName("UX_Item_CompanyLicCod_Code_IsDeleted");
    #endregion

    #region Propiedades principales
    entity.Property(e => e.GuidId).IsRequired().HasMaxLength(128);
    entity.Property(e => e.CompanyLicCod).IsRequired().HasMaxLength(15);
    entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
    entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
    entity.Property(e => e.Description).HasMaxLength(500);
    entity.Property(e => e.IsActive).IsRequired().HasColumnType("tinyint(1)").HasDefaultValue(true);
    #endregion

    #region IsDeleted
    entity.Property(e => e.IsDeleted).IsRequired().HasColumnType("tinyint(1)").HasDefaultValue(false);
    #endregion

    #region Auditoría
    entity.ApplyAuditConfiguration(DbTypes.MySql);
    #endregion
});
