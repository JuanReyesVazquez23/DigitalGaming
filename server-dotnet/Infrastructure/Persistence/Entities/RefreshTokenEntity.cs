using DigitalGaming.Core.Models;

namespace DigitalGaming.Infrastructure.Persistence.Entities;

/// <summary>
/// Persists a <see cref="RefreshToken"/> in Postgres (hash only, never the plain token).
/// </summary>
/// <remarks>Layer: Infrastructure/Persistence.</remarks>
public sealed class RefreshTokenEntity
{
    /// <summary>Gets or sets the unique token record identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the owning user identifier.</summary>
    public Guid UserId { get; set; }

    /// <summary>Gets or sets the SHA256 hash of the opaque token (hex).</summary>
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>Gets or sets the creation date in UTC.</summary>
    public DateTime CreatedAtUtc { get; set; }

    /// <summary>Gets or sets the expiration date in UTC.</summary>
    public DateTime ExpiresAtUtc { get; set; }

    /// <summary>Gets or sets the revocation date in UTC, or <see langword="null" />.</summary>
    public DateTime? RevokedAtUtc { get; set; }

    /// <summary>
    /// Maps a domain token to its entity.
    /// </summary>
    /// <param name="t">The domain token.</param>
    /// <returns>The entity.</returns>
    public static RefreshTokenEntity FromDomain(RefreshToken t) => new()
    {
        Id = t.Id,
        UserId = t.UserId,
        TokenHash = t.TokenHash,
        CreatedAtUtc = t.CreatedAtUtc,
        ExpiresAtUtc = t.ExpiresAtUtc,
        RevokedAtUtc = t.RevokedAtUtc,
    };

    /// <summary>
    /// Maps the entity to its domain token.
    /// </summary>
    /// <returns>The domain token.</returns>
    public RefreshToken ToDomain() => new(Id, UserId, TokenHash, CreatedAtUtc, ExpiresAtUtc, RevokedAtUtc);
}
