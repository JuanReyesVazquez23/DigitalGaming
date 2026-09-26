using DigitalGaming.Core.Models;

namespace DigitalGaming.Core.Interfaces;

/// <summary>
/// Defines JWT creation for authenticated users.
/// </summary>
/// <remarks>Layer: Core (Provider Pattern abstraction).</remarks>
public interface IJwtTokenService
{
    /// <summary>
    /// Generates a signed JWT for the user.
    /// </summary>
    /// <param name="user">The authenticated user.</param>
    /// <returns>The token and its UTC expiration.</returns>
    (string Token, DateTime ExpiresAtUtc) GenerateToken(User user);
}
