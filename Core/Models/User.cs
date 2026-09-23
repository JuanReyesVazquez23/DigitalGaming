namespace DigitalGaming.Core.Models;

/// <summary>
/// Represents a registered store user.
/// </summary>
/// <remarks>Layer: Core/Domain.</remarks>
public sealed record User
{
    /// <summary>
    /// Gets the unique user identifier.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Gets the login name (unique, case-insensitive).
    /// </summary>
    public string Username { get; init; } = string.Empty;

    /// <summary>
    /// Gets the PBKDF2 password hash (never the plain password).
    /// </summary>
    public string PasswordHash { get; init; } = string.Empty;

    /// <summary>
    /// Gets the user role ("admin" or "cliente").
    /// </summary>
    public string Role { get; init; } = "cliente";

    /// <summary>
    /// Gets the creation date in UTC.
    /// </summary>
    public DateTime CreatedAtUtc { get; init; }

    /// <summary>
    /// Initializes a new instance of the <see cref="User"/> class.
    /// </summary>
    /// <param name="id">The unique user identifier.</param>
    /// <param name="username">The login name.</param>
    /// <param name="passwordHash">The PBKDF2 password hash.</param>
    /// <param name="role">The user role.</param>
    /// <param name="createdAtUtc">The creation date in UTC.</param>
    public User(Guid id, string username, string passwordHash, string role, DateTime createdAtUtc)
    {
        Id = id;
        Username = username;
        PasswordHash = passwordHash;
        Role = role;
        CreatedAtUtc = createdAtUtc;
    }
}
