using DigitalMarket.Core.Interfaces;
using DigitalMarket.Core.Models;
using DigitalMarket.Infrastructure.Persistence;
using DigitalMarket.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace DigitalMarket.Infrastructure.Repositories;

/// <summary>
/// Provides a Postgres implementation of <see cref="IProductRepository"/> via EF Core.
/// </summary>
/// <remarks>Layer: Infrastructure.</remarks>
/// <param name="db">The database context.</param>
public sealed class EfProductRepository(AppDbContext db) : IProductRepository
{
    private readonly AppDbContext _db = db ?? throw new ArgumentNullException(nameof(db));

    /// <inheritdoc/>
    public async Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var items = await _db.Products.AsNoTracking().OrderBy(p => p.Name).ToListAsync(cancellationToken).ConfigureAwait(false);
        return items.Select(p => p.ToDomain()).ToList();
    }

    /// <inheritdoc/>
    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var e = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken).ConfigureAwait(false);
        return e?.ToDomain();
    }

    /// <inheritdoc/>
    public async Task<Product> AddAsync(Product product, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(product);
        _db.Products.Add(ProductEntity.FromDomain(product));
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return product;
    }

    /// <inheritdoc/>
    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var e = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken).ConfigureAwait(false);
        if (e is null)
        {
            return false;
        }

        _db.Products.Remove(e);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return true;
    }

    /// <inheritdoc/>
    public async Task<Product?> UpdateAsync(Product product, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(product);
        var e = await _db.Products.FirstOrDefaultAsync(p => p.Id == product.Id, cancellationToken).ConfigureAwait(false);
        if (e is null)
        {
            return null;
        }

        e.Name = product.Name;
        e.Price = product.Price;
        e.Category = product.Category;
        e.ImageUrl = product.ImageUrl;
        e.Description = product.Description;
        e.Stock = product.Stock;
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return product;
    }
}
