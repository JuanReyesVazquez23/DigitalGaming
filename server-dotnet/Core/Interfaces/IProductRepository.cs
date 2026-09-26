using DigitalGaming.Core.Models;

namespace DigitalGaming.Core.Interfaces;

/// <summary>
/// Defines async data access operations for <see cref="Product"/> entities.
/// </summary>
/// <remarks>Layer: Core (Repository Pattern abstraction).</remarks>
public interface IProductRepository
{
    /// <summary>
    /// Gets all products asynchronously.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The list of products.</returns>
    Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a product by identifier asynchronously.
    /// </summary>
    /// <param name="id">The product identifier.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The product, or <see langword="null" /> if not found.</returns>
    Task<Product?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a product asynchronously.
    /// </summary>
    /// <param name="product">The product to add.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The added product.</returns>
    Task<Product> AddAsync(Product product, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a product asynchronously.
    /// </summary>
    /// <param name="id">The product identifier.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns><see langword="true" /> if the product was deleted; otherwise, <see langword="false" />.</returns>
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates a product asynchronously.
    /// </summary>
    /// <param name="product">The product with updated values.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The updated product, or <see langword="null" /> if not found.</returns>
    Task<Product?> UpdateAsync(Product product, CancellationToken cancellationToken = default);
}
