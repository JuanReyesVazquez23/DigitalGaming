using DigitalMarket.Core.Models;

namespace DigitalMarket.Infrastructure.Persistence.Entities;

/// <summary>
/// Persists an <see cref="Order"/> in Postgres.
/// </summary>
/// <remarks>Layer: Infrastructure/Persistence.</remarks>
public sealed class OrderEntity
{
    /// <summary>Gets or sets the unique order identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the buying user identifier.</summary>
    public Guid UserId { get; set; }

    /// <summary>Gets or sets the buying username snapshot.</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>Gets or sets the order total in RD$.</summary>
    public decimal Total { get; set; }

    /// <summary>Gets or sets the creation date in UTC.</summary>
    public DateTime CreatedAtUtc { get; set; }

    /// <summary>Gets or sets the order lines.</summary>
    public List<OrderItemEntity> Items { get; set; } = [];

    /// <summary>
    /// Maps a domain order to its entity.
    /// </summary>
    /// <param name="o">The domain order.</param>
    /// <returns>The entity.</returns>
    public static OrderEntity FromDomain(Order o) => new()
    {
        Id = o.Id,
        UserId = o.UserId,
        Username = o.Username,
        Total = o.Total,
        CreatedAtUtc = o.CreatedAtUtc,
        Items = o.Items.Select(i => new OrderItemEntity
        {
            Id = Guid.NewGuid(),
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            UnitPrice = i.UnitPrice,
            Quantity = i.Quantity,
        }).ToList(),
    };

    /// <summary>
    /// Maps the entity to its domain order.
    /// </summary>
    /// <returns>The domain order.</returns>
    public Order ToDomain() => new(
        Id,
        UserId,
        Username,
        Items.Select(i => new OrderItem(i.ProductId, i.ProductName, i.UnitPrice, i.Quantity)).ToList(),
        Total,
        CreatedAtUtc);
}

/// <summary>
/// Persists an <see cref="OrderItem"/> line in Postgres.
/// </summary>
public sealed class OrderItemEntity
{
    /// <summary>Gets or sets the unique line identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the parent order identifier.</summary>
    public Guid OrderId { get; set; }

    /// <summary>Gets or sets the parent order navigation.</summary>
    public OrderEntity? Order { get; set; }

    /// <summary>Gets or sets the purchased product identifier.</summary>
    public Guid ProductId { get; set; }

    /// <summary>Gets or sets the product name snapshot.</summary>
    public string ProductName { get; set; } = string.Empty;

    /// <summary>Gets or sets the unit price in RD$ at purchase time.</summary>
    public decimal UnitPrice { get; set; }

    /// <summary>Gets or sets the purchased quantity.</summary>
    public int Quantity { get; set; }
}
