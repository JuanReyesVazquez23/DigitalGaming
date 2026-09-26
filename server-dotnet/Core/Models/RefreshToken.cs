namespace DigitalGaming.Core.Models;

/// <summary>
/// Represents a revocable refresh token (only its hash is stored).
/// </summary>
/// <remarks>Layer: Core/Domain. Rotation: each use revokes the old token and issues a new pair.</remarks>
public sealed record RefreshToken
{
    /// <summary>
    /// Gets the unique token record identifier.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Gets the owning user identifier.
    /// </summary>
    public Guid UserId { get; init; }

    /// <summary>
    /// Gets the SHA256 hash of the opaque token (hex).
    /// </summary>
    public string TokenHash { get; init; } = string.Empty;

    /// <summary>
    /// Gets the creation date in UTC.
    /// </summary>
    public DateTime CreatedAtUtc { get; init; }

    /// <summary>
    /// Gets the expiration date in UTC.
    /// </summary>
    public DateTime ExpiresAtUtc { get; init; }

    /// <summary>
    /// Gets the revocation date in UTC, or <see langword="null" /> if active.
    /// </summary>
    public DateTime? RevokedAtUtc { get; init; }

    /// <summary>
    /// Initializes a new instance of the <see cref="RefreshToken"/> class.
    /// </summary>
    /// <param name="id">The unique token record identifier.</param>
    /// <param name="userId">The owning user identifier.</param>
    /// <param name="tokenHash">The SHA256 hash of the opaque token.</param>
    /// <param name="createdAtUtc">The creation date in UTC.</param>
    /// <param name="expiresAtUtc">The expiration date in UTC.</param>
    /// <param name="revokedAtUtc">The revocation date in UTC, or <see langword="null" />.</param>
    public RefreshToken(Guid id, Guid userId, string tokenHash, DateTime createdAtUtc, DateTime expiresAtUtc, DateTime? revokedAtUtc = null)
    {
        Id = id;
        UserId = userId;
        TokenHash = tokenHash;
        CreatedAtUtc = createdAtUtc;
        ExpiresAtUtc = expiresAtUtc;
        RevokedAtUtc = revokedAtUtc;
    }
}
