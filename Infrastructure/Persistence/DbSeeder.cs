using DigitalGaming.Core.Models;
using DigitalGaming.Infrastructure.Persistence.Entities;
using DigitalGaming.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace DigitalGaming.Infrastructure.Persistence;

/// <summary>
/// Seeds Postgres on first boot (GTA VI product + demo admin), mirroring the InMemory seed.
/// </summary>
/// <remarks>Layer: Infrastructure/Persistence. Runs once: inserts only when tables are empty.</remarks>
public static class DbSeeder
{
    /// <summary>
    /// Seeds the database if empty asynchronously.
    /// </summary>
    /// <param name="db">The context.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    public static async Task SeedAsync(AppDbContext db, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(db);
        if (!await db.Products.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            db.Products.Add(new ProductEntity
            {
                // Why GUID fijo: mismo Id en todos los entornos/reinicios.
                Id = Guid.Parse("6f1e3a2b-8c4d-4e5f-9a6b-3c7d8e9f0a1b"),
                Name = "GTA VI — Reserva preventa",
                Price = 4950,
                Category = Category.Videojuegos,
                ImageUrl = "./assets/gta6.jpg",
                Description = "Reserva el GTA VI y no te quedes sin el juego más esperado de la historia. Apartado con RD$4,950, válido para PS5 y Xbox Series.",
                Stock = 50,
                Hidden = true,
            });
        }

        if (!await db.Users.AnyAsync(u => u.Username == "admin", cancellationToken).ConfigureAwait(false))
        {
            db.Users.Add(new UserEntity
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                PasswordHash = PasswordHasher.Hash("Admin1234"),
                Role = "admin",
                CreatedAtUtc = DateTime.UtcNow,
            });
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
