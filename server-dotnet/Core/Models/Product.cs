namespace DigitalGaming.Core.Models;

/// <summary>
/// Represents a product sold in the DigitalGaming videogame store.
/// </summary>
/// <remarks>
/// Domain entity (Layer: Core/Domain). No dependencies on infrastructure.
/// </remarks>
public sealed record Product
{
    /// <summary>
    /// Gets the unique product identifier.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Gets the product display name.
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Gets the product price in MXN.
    /// </summary>
    public decimal Price { get; init; }

    /// <summary>
    /// Gets one of the enumeration values that specifies the product category.
    /// </summary>
    public Category Category { get; init; }

    /// <summary>
    /// Gets the product image URL or base64 data URI.
    /// </summary>
    public string ImageUrl { get; init; } = string.Empty;

    /// <summary>
    /// Gets the product short description.
    /// </summary>
    public string Description { get; init; } = string.Empty;

    /// <summary>
    /// Gets the available stock quantity.
    /// </summary>
    public int Stock { get; init; }

    /// <summary>
    /// Gets a value that indicates whether the product is hidden from the catalog.
    /// </summary>
    /// <remarks>Hidden products only show through direct entry points (e.g. the GTA VI reserve button).</remarks>
    public bool Hidden { get; init; }

    /// <summary>
    /// Initializes a new instance of the <see cref="Product"/> class.
    /// </summary>
    /// <param name="id">The unique product identifier.</param>
    /// <param name="name">The product display name.</param>
    /// <param name="price">The product price in MXN.</param>
    /// <param name="category">One of the enumeration values that specifies the product category.</param>
    /// <param name="imageUrl">The product image URL or base64 data URI.</param>
    /// <param name="description">The product short description.</param>
    /// <param name="stock">The available stock quantity.</param>
    /// <param name="hidden">Whether the product is hidden from the catalog.</param>
    public Product(Guid id, string name, decimal price, Category category, string imageUrl, string description, int stock, bool hidden = false)
    {
        Id = id;
        Name = name;
        Price = price;
        Category = category;
        ImageUrl = imageUrl;
        Description = description;
        Stock = stock;
        Hidden = hidden;
    }
}
