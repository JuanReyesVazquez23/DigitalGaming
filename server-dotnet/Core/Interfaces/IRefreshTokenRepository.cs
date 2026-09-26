using DigitalGaming.Core.Models;

namespace DigitalGaming.Core.Interfaces;

/// <summary>
/// Defines async data access operations for <see cref="RefreshToken"/> entities.
/// </summary>
/// <remarks>Layer: Core (Repository Pattern abstraction).</remarks>
public interface IRefreshTokenRepository
{
    /// <summary>
    /// Adds a refresh token asynchronously.
    /// </summary>
    /// <param name="token">The token to add.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The added token.</returns>
    Task<RefreshToken> AddAsync(RefreshToken token, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a token by its hash asynchronously.
    /// </summary>
    /// <param name="tokenHash">The SHA256 hash (hex).</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The token, or <see langword="null" /> if not found.</returns>
    Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken cancellationToken = default);

    /// <summary>
    /// Revokes a token by its hash asynchronously.
    /// </summary>
    /// <param name="tokenHash">The SHA256 hash (hex).</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns><see langword="true" /> if revoked; otherwise, <see langword="false" />.</returns>
    Task<bool> RevokeAsync(string tokenHash, CancellationToken cancellationToken = default);

    /// <summary>
    /// Revokes all tokens of a user asynchronously (logout everywhere).
    /// </summary>
    /// <param name="userId">The owning user identifier.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The revoked count.</returns>
    Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
