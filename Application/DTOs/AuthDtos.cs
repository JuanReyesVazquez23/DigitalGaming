using System.ComponentModel.DataAnnotations;

namespace DigitalMarket.Application.DTOs;

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
/// Represents the signed-in session returned after register/login.
/// </summary>
/// <param name="Token">The signed JWT.</param>
/// <param name="Username">The login name.</param>
/// <param name="ExpiresAtUtc">The token UTC expiration.</param>
public sealed record AuthResponseDto(string Token, string Username, DateTime ExpiresAtUtc);
