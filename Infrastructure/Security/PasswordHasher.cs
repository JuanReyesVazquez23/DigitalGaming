using System.Security.Cryptography;

namespace DigitalMarket.Infrastructure.Security;

/// <summary>
/// Hashes and verifies passwords with PBKDF2-SHA256 (no plain passwords stored).
/// </summary>
/// <remarks>Layer: Infrastructure. Format: <c>pbkdf2-sha256$iterations$salt$hash</c>.</remarks>
public static class PasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 210_000;

    /// <summary>
    /// Hashes a plain password.
    /// </summary>
    /// <param name="password">The plain password.</param>
    /// <returns>The encoded hash.</returns>
    public static string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, HashSize);
        return $"pbkdf2-sha256${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    /// <summary>
    /// Verifies a plain password against its stored hash.
    /// </summary>
    /// <param name="password">The plain password.</param>
    /// <param name="stored">The stored hash.</param>
    /// <returns><see langword="true" /> if it matches; otherwise, <see langword="false" />.</returns>
    public static bool Verify(string password, string stored)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(stored))
        {
            return false;
        }

        var parts = stored.Split('$');
        if (parts.Length != 4 || parts[0] != "pbkdf2-sha256")
        {
            return false;
        }

        if (!int.TryParse(parts[1], out var iterations))
        {
            return false;
        }

        var salt = Convert.FromBase64String(parts[2]);
        var expected = Convert.FromBase64String(parts[3]);
        var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
