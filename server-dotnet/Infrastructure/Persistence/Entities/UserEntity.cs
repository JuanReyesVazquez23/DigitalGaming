using DigitalGaming.Core.Models;

namespace DigitalGaming.Infrastructure.Persistence.Entities;

/// <summary>
/// Persists a <see cref="User"/> in Postgres.
/// </summary>
/// <remarks>Layer: Infrastructure/Persistence. Only hashes are stored, never plain passwords.</remarks>
public sealed class UserEntity
{
    /// <summary>Gets or sets the unique user identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the login name (unique).</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>Gets or sets the PBKDF2 password hash.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Gets or sets the user role.</summary>
    public string Role { get; set; } = "cliente";

    /// <summary>Gets or sets the creation date in UTC.</summary>
    public DateTime CreatedAtUtc { get; set; }

    /// <summary>
    /// Maps a domain user to its entity.
    /// </summary>
    /// <param name="u">The domain user.</param>
    /// <returns>The entity.</returns>
    public static UserEntity FromDomain(User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        PasswordHash = u.PasswordHash,
        Role = u.Role,
        CreatedAtUtc = u.CreatedAtUtc,
    };

    /// <summary>
    /// Maps the entity to its domain user.
    /// </summary>
    /// <returns>The domain user.</returns>
    public User ToDomain() => new(Id, Username, PasswordHash, Role, CreatedAtUtc);
}
