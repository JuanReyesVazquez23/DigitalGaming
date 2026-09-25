namespace DigitalGaming.Core.Models;

/// <summary>
/// Represents one offset window of a catalog query (desplazamiento).
/// </summary>
/// <typeparam name="T">The item type.</typeparam>
/// <param name="Items">The window items.</param>
/// <param name="Total">The total matching items.</param>
/// <param name="Limit">The requested window size.</param>
/// <param name="Offset">The requested displacement from the start.</param>
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Limit, int Offset)
{
    /// <summary>
    /// Gets whether more items exist after this window.
    /// </summary>
    public bool HasMore => Offset + Items.Count < Total;
}
