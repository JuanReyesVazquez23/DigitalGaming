namespace DigitalGaming.Infrastructure.Security;

/// <summary>
/// Gets the strongly-typed JWT settings bound from configuration.
/// </summary>
/// <remarks>Layer: Infrastructure. In production, set <c>Jwt__Key</c> from environment/secret store.</remarks>
public sealed class JwtOptions
{
    /// <summary>
    /// Gets or sets the HMAC signing key (minimum 32 characters).
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the token issuer.
    /// </summary>
    public string Issuer { get; set; } = "DigitalGaming";

    /// <summary>
    /// Gets or sets the token audience.
    /// </summary>
    public string Audience { get; set; } = "DigitalGaming";

    /// <summary>
    /// Gets or sets the access token lifetime in minutes.
    /// </summary>
    public int AccessExpiryMinutes { get; set; } = 15;

    /// <summary>
    /// Gets or sets the refresh token lifetime in days.
    /// </summary>
    public int RefreshTokenDays { get; set; } = 30;
}
