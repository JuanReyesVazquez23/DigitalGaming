using DigitalGaming.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace DigitalGaming.Infrastructure.Persistence;

/// <summary>
/// EF Core context for Postgres (Supabase). Used only when a connection string is configured.
/// </summary>
/// <remarks>Layer: Infrastructure/Persistence.</remarks>
/// <param name="options">The context options.</param>
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    /// <summary>Gets or sets the products table.</summary>
    public DbSet<ProductEntity> Products => Set<ProductEntity>();

    /// <summary>Gets or sets the users table.</summary>
    public DbSet<UserEntity> Users => Set<UserEntity>();

    /// <summary>Gets or sets the orders table.</summary>
    public DbSet<OrderEntity> Orders => Set<OrderEntity>();

    /// <summary>Gets or sets the order lines table.</summary>
    public DbSet<OrderItemEntity> OrderItems => Set<OrderItemEntity>();

    /// <summary>Gets or sets the refresh tokens table.</summary>
    public DbSet<RefreshTokenEntity> RefreshTokens => Set<RefreshTokenEntity>();

    /// <inheritdoc/>
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<ProductEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(80).IsRequired();
            e.Property(x => x.Price).HasPrecision(12, 2);
            // Why TEXT sin límite: el fallback base64 local supera los 2000 caracteres
            // y el servidor devolvía 500 en vez de guardar.
            e.Property(x => x.ImageUrl).HasColumnType("text");
            e.Property(x => x.Description).HasMaxLength(500);
        });
        b.Entity<UserEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Username).HasMaxLength(40).IsRequired();
            e.HasIndex(x => x.Username).IsUnique();
            e.Property(x => x.PasswordHash).HasMaxLength(200).IsRequired();
            e.Property(x => x.Role).HasMaxLength(20);
        });
        b.Entity<OrderEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Total).HasPrecision(12, 2);
            e.HasIndex(x => x.UserId);
            e.HasMany(x => x.Items).WithOne(x => x.Order).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });
        b.Entity<OrderItemEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.UnitPrice).HasPrecision(12, 2);
        });
        b.Entity<RefreshTokenEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasIndex(x => x.UserId);
        });
    }
}
