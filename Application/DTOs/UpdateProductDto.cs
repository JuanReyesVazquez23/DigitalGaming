using System.ComponentModel.DataAnnotations;
using DigitalGaming.Core.Models;

namespace DigitalGaming.Application.DTOs;

/// <summary>
/// Represents the payload to update a product from the admin panel.
/// </summary>
public sealed record UpdateProductDto
{
    /// <summary>
    /// Gets the product display name.
    /// </summary>
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MinLength(2, ErrorMessage = "El nombre debe tener al menos 2 caracteres.")]
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Gets the product price in Dominican pesos (RD$).
    /// </summary>
    [Range(1, 10_000_000, ErrorMessage = "El precio debe ser mayor a 0.")]
    public decimal Price { get; init; }

    /// <summary>
    /// Gets one of the enumeration values that specifies the product category.
    /// </summary>
    [Required]
    public Category Category { get; init; }

    /// <summary>
    /// Gets the product image URL or base64 data URI.
    /// </summary>
    public string ImageUrl { get; init; } = string.Empty;

    /// <summary>
    /// Gets the product short description.
    /// </summary>
    [MaxLength(500)]
    public string Description { get; init; } = string.Empty;

    /// <summary>
    /// Gets the available stock quantity.
    /// </summary>
    [Range(0, 100_000)]
    public int Stock { get; init; }
}
