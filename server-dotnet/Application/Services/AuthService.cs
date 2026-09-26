using System.Security.Cryptography;
using System.Text;
using DigitalGaming.Application.DTOs;
using DigitalGaming.Core.Interfaces;
using DigitalGaming.Core.Models;
using DigitalGaming.Infrastructure.Security;
using Microsoft.Extensions.Options;

namespace DigitalGaming.Application.Services;

/// <summary>
/// Implements registration, login and refresh-token rotation with PBKDF2 hashes and JWT sessions.
/// </summary>
/// <remarks>Layer: Application.</remarks>
/// <param name="users">The user repository.</param>
/// <param name="tokens">The JWT provider.</param>
/// <param name="refresh">The refresh token repository.</param>
/// <param name="options">The JWT settings.</param>
public sealed class AuthService(
    IUserRepository users,
    IJwtTokenService tokens,
    IRefreshTokenRepository refresh,
    IOptions<JwtOptions> options) : IAuthService
{
    private readonly IUserRepository _users = users ?? throw new ArgumentNullException(nameof(users));
    private readonly IJwtTokenService _tokens = tokens ?? throw new ArgumentNullException(nameof(tokens));
    private readonly IRefreshTokenRepository _refresh = refresh ?? throw new ArgumentNullException(nameof(refresh));
    private readonly JwtOptions _options = options?.Value ?? throw new ArgumentNullException(nameof(options));

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
        return await IssueSessionAsync(user, cancellationToken).ConfigureAwait(false);
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

        return await IssueSessionAsync(user, cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc/>
    public async Task<AuthResponseDto?> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return null;
        }

        var stored = await _refresh.GetByHashAsync(Hash(refreshToken), cancellationToken).ConfigureAwait(false);
        if (stored is null || stored.RevokedAtUtc.HasValue || stored.ExpiresAtUtc <= DateTime.UtcNow)
        {
            return null;
        }

        var user = await _users.GetByIdAsync(stored.UserId, cancellationToken).ConfigureAwait(false);
        if (user is null)
        {
            return null;
        }

        // Why rotación: el refresh usado se revoca; si lo robaron, el legítimo falla
        // al siguiente uso y ambas sesiones pueden invalidarse.
        await _refresh.RevokeAsync(stored.TokenHash, cancellationToken).ConfigureAwait(false);
        return await IssueSessionAsync(user, cancellationToken).ConfigureAwait(false);
    }

    /// <inheritdoc/>
    public async Task LogoutAsync(Guid userId, string? refreshToken, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            await _refresh.RevokeAsync(Hash(refreshToken), cancellationToken).ConfigureAwait(false);
            return;
        }

        if (userId != Guid.Empty)
        {
            await _refresh.RevokeAllForUserAsync(userId, cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task<AuthResponseDto> IssueSessionAsync(User user, CancellationToken cancellationToken)
    {
        var (token, expires) = _tokens.GenerateToken(user);
        var opaque = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var days = Math.Max(1, _options.RefreshTokenDays);
        await _refresh.AddAsync(new RefreshToken(
            Guid.NewGuid(),
            user.Id,
            Hash(opaque),
            DateTime.UtcNow,
            DateTime.UtcNow.AddDays(days)), cancellationToken).ConfigureAwait(false);
        return new AuthResponseDto(token, opaque, user.Username, expires);
    }

    private static string Hash(string value)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
