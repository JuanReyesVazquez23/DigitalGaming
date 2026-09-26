using DigitalGaming.Application.DTOs;

namespace DigitalGaming.Core.Interfaces;

/// <summary>
/// Defines registration and login operations.
/// </summary>
/// <remarks>Layer: Core (Service contract, implemented in Application).</remarks>
public interface IAuthService
{
    /// <summary>
    /// Registers a user with name and password asynchronously.
    /// </summary>
    /// <param name="dto">The registration payload.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The signed-in session (JWT).</returns>
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates name and password asynchronously.
    /// </summary>
    /// <param name="dto">The login payload.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The signed-in session (JWT), or <see langword="null" /> if credentials are invalid.</returns>
    Task<AuthResponseDto?> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Rotates a refresh token, issuing a new session asynchronously.
    /// </summary>
    /// <param name="refreshToken">The opaque refresh token.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The new session, or <see langword="null" /> if invalid, expired or revoked.</returns>
    Task<AuthResponseDto?> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default);

    /// <summary>
    /// Logs out asynchronously: revokes one refresh token, or all user sessions.
    /// </summary>
    /// <param name="userId">The owning user identifier.</param>
    /// <param name="refreshToken">The opaque refresh token, or <see langword="null" /> for all sessions.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    Task LogoutAsync(Guid userId, string? refreshToken, CancellationToken cancellationToken = default);
}
