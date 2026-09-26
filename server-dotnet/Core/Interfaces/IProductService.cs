using DigitalGaming.Application.DTOs;
using DigitalGaming.Core.Models;

namespace DigitalGaming.Core.Interfaces;

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
    /// Gets one catalog window with optional filters asynchronously (desplazamiento).
    /// </summary>
    /// <param name="limit">The window size (clamped to 1-50).</param>
    /// <param name="offset">The displacement from the start.</param>
    /// <param name="category">The category name filter, or <see langword="null" /> for all.</param>
    /// <param name="query">The text search, or <see langword="null" /> for all.</param>
    /// <param name="includeHidden">Whether to include hidden products.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The requested window.</returns>
    Task<PagedResult<Product>> GetPagedAsync(int limit, int offset, string? category, string? query, bool includeHidden, CancellationToken cancellationToken = default);

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
