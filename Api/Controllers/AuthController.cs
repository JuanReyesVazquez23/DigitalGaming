using System.Security.Claims;
using DigitalMarket.Application.DTOs;
using DigitalMarket.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigitalMarket.Api.Controllers;

/// <summary>
/// Exposes registration and login (username + password) returning JWT sessions.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    private readonly IAuthService _auth = auth ?? throw new ArgumentNullException(nameof(auth));

    /// <summary>
    /// Registers a user with username and password.
    /// </summary>
    /// <param name="dto">The registration payload.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The session with JWT.</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var session = await _auth.RegisterAsync(dto, ct).ConfigureAwait(false);
            return CreatedAtAction(nameof(Me), null, session);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Validates username and password, returning a JWT session.
    /// </summary>
    /// <param name="dto">The login payload.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The session with JWT.</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var session = await _auth.LoginAsync(dto, ct).ConfigureAwait(true);
        return session is null ? Unauthorized(new { message = "Nombre o contraseña incorrectos." }) : Ok(session);
    }

    /// <summary>
    /// Gets the current JWT identity (requires login).
    /// </summary>
    /// <returns>The username and role from the token.</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<object> Me()
    {
        var username = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("unique_name");
        var role = User.FindFirstValue(ClaimTypes.Role);
        return Ok(new { username, role });
    }
}
