using System.ComponentModel.DataAnnotations;

namespace DigitalGaming.Application.DTOs;

/// <summary>
/// Represents one cart line sent to checkout.
/// </summary>
public sealed record CheckoutItemDto
{
    /// <summary>
    /// Gets the product identifier.
    /// </summary>
    [Required]
    public Guid ProductId { get; init; }

    /// <summary>
    /// Gets the desired quantity.
    /// </summary>
    [Range(1, 99, ErrorMessage = "La cantidad debe estar entre 1 y 99.")]
    public int Quantity { get; init; }
}

/// <summary>
/// Represents the checkout payload (cart purchase).
/// </summary>
public sealed record CheckoutDto
{
    /// <summary>
    /// Gets the cart items.
    /// </summary>
    [Required]
    [MinLength(1, ErrorMessage = "El carrito está vacío.")]
    public IReadOnlyList<CheckoutItemDto> Items { get; init; } = [];

    /// <summary>
    /// Gets the shipping zone identifier.
    /// </summary>
    public string ZoneId { get; init; } = "santo-domingo";
}
