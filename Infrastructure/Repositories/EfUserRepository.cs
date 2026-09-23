using DigitalMarket.Core.Interfaces;
using DigitalMarket.Core.Models;
using DigitalMarket.Infrastructure.Persistence;
using DigitalMarket.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace DigitalMarket.Infrastructure.Repositories;

/// <summary>
/// Provides a Postgres implementation of <see cref="IUserRepository"/> via EF Core.
/// </summary>
/// <remarks>Layer: Infrastructure.</remarks>
/// <param name="db">The database context.</param>
public sealed class EfUserRepository(AppDbContext db) : IUserRepository
{
    private readonly AppDbContext _db = db ?? throw new ArgumentNullException(nameof(db));

    /// <inheritdoc/>
    public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        var name = username.Trim().ToLowerInvariant();
        var e = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username.ToLower() == name, cancellationToken).ConfigureAwait(false);
        return e?.ToDomain();
    }

    /// <inheritdoc/>
    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var e = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, cancellationToken).ConfigureAwait(false);
        return e?.ToDomain();
    }

    /// <inheritdoc/>
    public async Task<User> AddAsync(User user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        if (await _db.Users.AnyAsync(u => u.Username.ToLower() == user.Username.ToLower(), cancellationToken).ConfigureAwait(false))
        {
            throw new InvalidOperationException("El nombre de usuario ya está en uso.");
        }

        _db.Users.Add(UserEntity.FromDomain(user));
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return user;
    }
}
