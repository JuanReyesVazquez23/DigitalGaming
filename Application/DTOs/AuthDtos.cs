using System.ComponentModel.DataAnnotations;

namespace DigitalGaming.Application.DTOs;

/// <summary>
/// Represents the payload to register with username and password.
/// </summary>
public sealed record RegisterDto
{
    /// <summary>
    /// Gets the desired login name.
    /// </summary>
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MinLength(3, ErrorMessage = "El nombre debe tener al menos 3 caracteres.")]
    [MaxLength(40)]
    public string Username { get; init; } = string.Empty;

    /// <summary>
    /// Gets the desired password.
    /// </summary>
    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
    [MaxLength(100)]
    public string Password { get; init; } = string.Empty;
}

/// <summary>
/// Represents the payload to log in with username and password.
/// </summary>
public sealed record LoginDto
{
    /// <summary>
    /// Gets the login name.
    /// </summary>
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    public string Username { get; init; } = string.Empty;

    /// <summary>
    /// Gets the password.
    /// </summary>
    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    public string Password { get; init; } = string.Empty;
}

/// <summary>
/// Represents the signed-in session returned after register/login/refresh.
/// </summary>
/// <param name="AccessToken">The short-lived signed JWT.</param>
/// <param name="RefreshToken">The opaque long-lived token (rotates on each use).</param>
/// <param name="Username">The login name.</param>
/// <param name="ExpiresAtUtc">The access token UTC expiration.</param>
public sealed record AuthResponseDto(string AccessToken, string RefreshToken, string Username, DateTime ExpiresAtUtc);

/// <summary>
/// Represents the payload to rotate a session.
/// </summary>
public sealed record RefreshDto
{
    /// <summary>
    /// Gets the opaque refresh token.
    /// </summary>
    [Required(ErrorMessage = "Falta el refresh token.")]
    public string RefreshToken { get; init; } = string.Empty;
}

/// <summary>
/// Represents the payload to log out (one or all sessions).
/// </summary>
public sealed record LogoutDto
{
    /// <summary>
    /// Gets the opaque refresh token, or <see langword="null" /> to close all sessions.
    /// </summary>
    public string? RefreshToken { get; init; }
}
