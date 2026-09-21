using DigitalMarket.Core.Models;

namespace DigitalMarket.Core.Interfaces;

/// <summary>
/// Defines async data access operations for <see cref="User"/> entities.
/// </summary>
/// <remarks>Layer: Core (Repository Pattern abstraction).</remarks>
public interface IUserRepository
{
    /// <summary>
    /// Gets a user by login name (case-insensitive) asynchronously.
    /// </summary>
    /// <param name="username">The login name.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The user, or <see langword="null" /> if not found.</returns>
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a user by identifier asynchronously.
    /// </summary>
    /// <param name="id">The user identifier.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The user, or <see langword="null" /> if not found.</returns>
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a user asynchronously.
    /// </summary>
    /// <param name="user">The user to add.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The added user.</returns>
    Task<User> AddAsync(User user, CancellationToken cancellationToken = default);
}
