using System.Collections.Concurrent;
using DigitalGaming.Core.Interfaces;
using DigitalGaming.Core.Models;

namespace DigitalGaming.Infrastructure.Repositories;

/// <summary>
/// Provides an in-memory implementation of <see cref="IRefreshTokenRepository"/> for the MVP.
/// </summary>
/// <remarks>Layer: Infrastructure. Keyed by token hash; only hashes are stored.</remarks>
public sealed class InMemoryRefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ConcurrentDictionary<string, RefreshToken> _store = new(StringComparer.Ordinal);

    /// <inheritdoc/>
    public Task<RefreshToken> AddAsync(RefreshToken token, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(token);
        cancellationToken.ThrowIfCancellationRequested();
        _store[token.TokenHash] = token;
        return Task.FromResult(token);
    }

    /// <inheritdoc/>
    public Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _store.TryGetValue(tokenHash, out var token);
        return Task.FromResult(token);
    }

    /// <inheritdoc/>
    public Task<bool> RevokeAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (!_store.TryGetValue(tokenHash, out var token) || token.RevokedAtUtc.HasValue)
        {
            return Task.FromResult(false);
        }

        _store[tokenHash] = token with { RevokedAtUtc = DateTime.UtcNow };
        return Task.FromResult(true);
    }

    /// <inheritdoc/>
    public Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var count = 0;
        foreach (var key in _store.Keys)
        {
            if (_store.TryGetValue(key, out var token)
                && token.UserId == userId
                && !token.RevokedAtUtc.HasValue)
            {
                _store[key] = token with { RevokedAtUtc = DateTime.UtcNow };
                count++;
            }
        }

        return Task.FromResult(count);
    }
}
