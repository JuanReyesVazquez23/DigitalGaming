using DigitalGaming.Core.Interfaces;
using DigitalGaming.Core.Models;
using DigitalGaming.Infrastructure.Persistence;
using DigitalGaming.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace DigitalGaming.Infrastructure.Repositories;

/// <summary>
/// Provides a Postgres implementation of <see cref="IRefreshTokenRepository"/> via EF Core.
/// </summary>
/// <remarks>Layer: Infrastructure.</remarks>
/// <param name="db">The database context.</param>
public sealed class EfRefreshTokenRepository(AppDbContext db) : IRefreshTokenRepository
{
    private readonly AppDbContext _db = db ?? throw new ArgumentNullException(nameof(db));

    /// <inheritdoc/>
    public async Task<RefreshToken> AddAsync(RefreshToken token, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(token);
        _db.RefreshTokens.Add(RefreshTokenEntity.FromDomain(token));
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return token;
    }

    /// <inheritdoc/>
    public async Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        var e = await _db.RefreshTokens.AsNoTracking().FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken).ConfigureAwait(false);
        return e?.ToDomain();
    }

    /// <inheritdoc/>
    public async Task<bool> RevokeAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        var e = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken).ConfigureAwait(false);
        if (e is null || e.RevokedAtUtc.HasValue)
        {
            return false;
        }

        e.RevokedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return true;
    }

    /// <inheritdoc/>
    public async Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var actives = await _db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync(cancellationToken).ConfigureAwait(false);
        foreach (var e in actives)
        {
            e.RevokedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return actives.Count;
    }
}
