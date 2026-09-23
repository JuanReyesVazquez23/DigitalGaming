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
}
