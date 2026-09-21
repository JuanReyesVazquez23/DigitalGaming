using System.Collections.Concurrent;
using DigitalMarket.Core.Interfaces;
using DigitalMarket.Core.Models;

namespace DigitalMarket.Infrastructure.Repositories;

/// <summary>
/// Provides an in-memory implementation of <see cref="IProductRepository"/> for the MVP.
/// </summary>
/// <remarks>
/// Layer: Infrastructure. Thread-safe via <see cref="ConcurrentDictionary{TKey, TValue}"/>.
/// Seed data covers: consolas, videojuegos, accesorios, PC y monitores.
/// </remarks>
public sealed class InMemoryProductRepository : IProductRepository
{
    private readonly ConcurrentDictionary<Guid, Product> _store = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="InMemoryProductRepository"/> class with seed data.
    /// </summary>
    public InMemoryProductRepository()
    {
        foreach (var p in Seed())
        {
            _store[p.Id] = p;
        }
    }

    /// <inheritdoc/>
    public Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        IReadOnlyList<Product> result = _store.Values.OrderBy(p => p.Name).ToList();
        return Task.FromResult(result);
    }

    /// <inheritdoc/>
    public Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _store.TryGetValue(id, out var product);
        return Task.FromResult(product);
    }

    /// <inheritdoc/>
    public Task<Product> AddAsync(Product product, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(product);
        cancellationToken.ThrowIfCancellationRequested();
        _store[product.Id] = product;
        return Task.FromResult(product);
    }

    /// <inheritdoc/>
    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(_store.TryRemove(id, out _));
    }

    /// <inheritdoc/>
    public Task<Product?> UpdateAsync(Product product, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(product);
        cancellationToken.ThrowIfCancellationRequested();
        if (!_store.ContainsKey(product.Id))
        {
            return Task.FromResult<Product?>(null);
        }

        _store[product.Id] = product;
        return Task.FromResult<Product?>(product);
    }

    private static IEnumerable<Product> Seed()
    {
        // Catálogo inicial: solo la preventa de GTA VI. El resto lo crea el admin.
        yield return new Product(Guid.NewGuid(), "GTA VI — Reserva preventa", 4950, Category.Videojuegos, "./assets/gta6.jpg", "Reserva el GTA VI y no te quedes sin el juego más esperado de la historia. Apartado con RD$4,950, válido para PS5 y Xbox Series.", 50);
    }
}
