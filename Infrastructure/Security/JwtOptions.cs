namespace DigitalMarket.Infrastructure.Security;

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
    public string Issuer { get; set; } = "DigitalMarket";

    /// <summary>
    /// Gets or sets the token audience.
    /// </summary>
    public string Audience { get; set; } = "DigitalMarket";

    /// <summary>
    /// Gets or sets the token lifetime in minutes.
    /// </summary>
    public int ExpiryMinutes { get; set; } = 720;
}
