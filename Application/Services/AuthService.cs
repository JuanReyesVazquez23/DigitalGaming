using DigitalMarket.Application.DTOs;
using DigitalMarket.Core.Interfaces;
using DigitalMarket.Core.Models;
using DigitalMarket.Infrastructure.Security;

namespace DigitalMarket.Application.Services;

/// <summary>
/// Implements registration and login with PBKDF2 hashes and JWT sessions.
/// </summary>
/// <remarks>Layer: Application.</remarks>
/// <param name="users">The user repository.</param>
/// <param name="tokens">The JWT provider.</param>
public sealed class AuthService(IUserRepository users, IJwtTokenService tokens) : IAuthService
{
    private readonly IUserRepository _users = users ?? throw new ArgumentNullException(nameof(users));
    private readonly IJwtTokenService _tokens = tokens ?? throw new ArgumentNullException(nameof(tokens));

    /// <inheritdoc/>
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);
        var username = dto.Username.Trim();
        if (username.Length < 3)
        {
            throw new ArgumentException("El nombre debe tener al menos 3 caracteres.", nameof(dto));
        }

        if (string.IsNullOrEmpty(dto.Password) || dto.Password.Length < 6)
        {
            throw new ArgumentException("La contraseña debe tener al menos 6 caracteres.", nameof(dto));
        }

        var existing = await _users.GetByUsernameAsync(username, cancellationToken).ConfigureAwait(false);
        if (existing is not null)
        {
            throw new InvalidOperationException("El nombre de usuario ya está en uso.");
        }

        var user = new User(Guid.NewGuid(), username, PasswordHasher.Hash(dto.Password), "cliente", DateTime.UtcNow);
        await _users.AddAsync(user, cancellationToken).ConfigureAwait(false);
        var (token, expires) = _tokens.GenerateToken(user);
        return new AuthResponseDto(token, user.Username, expires);
    }

    /// <inheritdoc/>
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);
        var user = await _users.GetByUsernameAsync(dto.Username.Trim(), cancellationToken).ConfigureAwait(false);
        if (user is null || !PasswordHasher.Verify(dto.Password, user.PasswordHash))
        {
            return null;
        }

        var (token, expires) = _tokens.GenerateToken(user);
        return new AuthResponseDto(token, user.Username, expires);
    }
}
