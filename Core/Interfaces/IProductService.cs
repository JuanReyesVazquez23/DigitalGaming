using DigitalMarket.Application.DTOs;
using DigitalMarket.Core.Models;

namespace DigitalMarket.Core.Interfaces;

/// <summary>
/// Defines business operations for the store catalog.
/// </summary>
/// <remarks>Layer: Core (Service contract, implemented in Application).</remarks>
public interface IProductService
{
    /// <summary>
    /// Gets the full catalog asynchronously.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The list of products.</returns>
    Task<IReadOnlyList<Product>> GetCatalogAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a product from a DTO asynchronously.
    /// </summary>
    /// <param name="dto">The creation payload.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The created product.</returns>
    Task<Product> CreateAsync(CreateProductDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes a product asynchronously.
    /// </summary>
    /// <param name="id">The product identifier.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns><see langword="true" /> if removed; otherwise, <see langword="false" />.</returns>
    Task<bool> RemoveAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates a product asynchronously.
    /// </summary>
    /// <param name="id">The product identifier.</param>
    /// <param name="dto">The updated values.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The updated product, or <see langword="null" /> if not found.</returns>
    Task<Product?> UpdateAsync(Guid id, UpdateProductDto dto, CancellationToken cancellationToken = default);
}
