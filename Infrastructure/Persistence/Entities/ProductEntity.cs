using DigitalMarket.Core.Models;

namespace DigitalMarket.Infrastructure.Persistence.Entities;

/// <summary>
/// Persists a <see cref="Product"/> in Postgres.
/// </summary>
/// <remarks>Layer: Infrastructure/Persistence.</remarks>
public sealed class ProductEntity
{
    /// <summary>Gets or sets the unique product identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the product display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Gets or sets the product price in RD$.</summary>
    public decimal Price { get; set; }

    /// <summary>Gets or sets the product category.</summary>
    public Category Category { get; set; }

    /// <summary>Gets or sets the product image URL.</summary>
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>Gets or sets the product short description.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Gets or sets the available stock quantity.</summary>
    public int Stock { get; set; }

    /// <summary>
    /// Maps a domain product to its entity.
    /// </summary>
    /// <param name="p">The domain product.</param>
    /// <returns>The entity.</returns>
    public static ProductEntity FromDomain(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Price = p.Price,
        Category = p.Category,
        ImageUrl = p.ImageUrl,
        Description = p.Description,
        Stock = p.Stock,
    };

    /// <summary>
    /// Maps the entity to its domain product.
    /// </summary>
    /// <returns>The domain product.</returns>
    public Product ToDomain() => new(Id, Name, Price, Category, ImageUrl, Description, Stock);
}
