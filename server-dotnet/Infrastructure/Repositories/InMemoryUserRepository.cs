using System.Collections.Concurrent;
using DigitalGaming.Core.Interfaces;
using DigitalGaming.Core.Models;
using DigitalGaming.Infrastructure.Security;

namespace DigitalGaming.Infrastructure.Repositories;

/// <summary>
/// Provides an in-memory implementation of <see cref="IUserRepository"/> for the MVP.
/// </summary>
/// <remarks>Layer: Infrastructure. Usernames are unique (case-insensitive).</remarks>
public sealed class InMemoryUserRepository : IUserRepository
{
    private readonly ConcurrentDictionary<string, User> _store = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Initializes a new instance of the <see cref="InMemoryUserRepository"/> class with a demo admin.
    /// </summary>
    /// <remarks>Demo: usuario <c>admin</c>, clave <c>Admin1234</c>. Solo para desarrollo local.</remarks>
    public InMemoryUserRepository()
    {
        var admin = new User(Guid.NewGuid(), "admin", PasswordHasher.Hash("Admin1234"), "admin", DateTime.UtcNow);
        _store[admin.Username] = admin;
    }

    /// <inheritdoc/>
    public Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _store.TryGetValue(username.Trim(), out var user);
        return Task.FromResult(user);
    }

    /// <inheritdoc/>
    public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(_store.Values.FirstOrDefault(u => u.Id == id));
    }

    /// <inheritdoc/>
    public Task<User> AddAsync(User user, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(user);
        cancellationToken.ThrowIfCancellationRequested();
        if (!_store.TryAdd(user.Username, user))
        {
            throw new InvalidOperationException("El nombre de usuario ya está en uso.");
        }

        return Task.FromResult(user);
    }
}
