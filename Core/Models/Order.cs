namespace DigitalGaming.Core.Models;

/// <summary>
/// Represents a line item inside an order (price snapshot at purchase time).
/// </summary>
public sealed record OrderItem
{
    /// <summary>
    /// Gets the purchased product identifier.
    /// </summary>
    public Guid ProductId { get; init; }

    /// <summary>
    /// Gets the product name snapshot.
    /// </summary>
    public string ProductName { get; init; } = string.Empty;

    /// <summary>
    /// Gets the unit price in RD$ at purchase time.
    /// </summary>
    public decimal UnitPrice { get; init; }

    /// <summary>
    /// Gets the purchased quantity.
    /// </summary>
    public int Quantity { get; init; }

    /// <summary>
    /// Initializes a new instance of the <see cref="OrderItem"/> class.
    /// </summary>
    /// <param name="productId">The purchased product identifier.</param>
    /// <param name="productName">The product name snapshot.</param>
    /// <param name="unitPrice">The unit price in RD$ at purchase time.</param>
    /// <param name="quantity">The purchased quantity.</param>
    public OrderItem(Guid productId, string productName, decimal unitPrice, int quantity)
    {
        ProductId = productId;
        ProductName = productName;
        UnitPrice = unitPrice;
        Quantity = quantity;
    }
}

/// <summary>
/// Represents a completed purchase (checkout) by a logged-in user.
/// </summary>
/// <remarks>Layer: Core/Domain.</remarks>
public sealed record Order
{
    /// <summary>
    /// Gets the unique order identifier.
    /// </summary>
    public Guid Id { get; init; }

    /// <summary>
    /// Gets the buying user identifier.
    /// </summary>
    public Guid UserId { get; init; }

    /// <summary>
    /// Gets the buying username snapshot.
    /// </summary>
    public string Username { get; init; } = string.Empty;

    /// <summary>
    /// Gets the purchased items.
    /// </summary>
    public IReadOnlyList<OrderItem> Items { get; init; } = [];

    /// <summary>
    /// Gets the order total in RD$.
    /// </summary>
    public decimal Total { get; init; }

    /// <summary>
    /// Gets the creation date in UTC.
    /// </summary>
    public DateTime CreatedAtUtc { get; init; }

    /// <summary>
    /// Initializes a new instance of the <see cref="Order"/> class.
    /// </summary>
    /// <param name="id">The unique order identifier.</param>
    /// <param name="userId">The buying user identifier.</param>
    /// <param name="username">The buying username snapshot.</param>
    /// <param name="items">The purchased items.</param>
    /// <param name="total">The order total in RD$.</param>
    /// <param name="createdAtUtc">The creation date in UTC.</param>
    public Order(Guid id, Guid userId, string username, IReadOnlyList<OrderItem> items, decimal total, DateTime createdAtUtc)
    {
        Id = id;
        UserId = userId;
        Username = username;
        Items = items;
        Total = total;
        CreatedAtUtc = createdAtUtc;
    }
}
