using DigitalGaming.Application.DTOs;
using DigitalGaming.Core.Interfaces;
using DigitalGaming.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DigitalGaming.Api.Controllers;

/// <summary>
/// Exposes the store catalog as a REST API for the HTML/TS frontend.
/// </summary>
/// <remarks>Reading is public; creating, editing and deleting require login (JWT).</remarks>
[ApiController]
[Route("api/[controller]")]
public sealed class ProductsController(IProductService service) : ControllerBase
{
    private readonly IProductService _service = service ?? throw new ArgumentNullException(nameof(service));

    /// <summary>
    /// Gets the full product catalog.
    /// </summary>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The list of products.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<Product>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Product>>> GetAll(CancellationToken ct)
    {
        var items = await _service.GetCatalogAsync(ct).ConfigureAwait(false);
        return Ok(items);
    }

    /// <summary>
    /// Creates a product from the admin panel.
    /// </summary>
    /// <param name="dto">The creation payload.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The created product.</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(Product), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<Product>> Create([FromBody] CreateProductDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var created = await _service.CreateAsync(dto, ct).ConfigureAwait(false);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    /// <summary>
    /// Deletes a product by identifier.
    /// </summary>
    /// <param name="id">The product identifier.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>No content if deleted; otherwise, not found.</returns>
    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var removed = await _service.RemoveAsync(id, ct).ConfigureAwait(false);
        return removed ? NoContent() : NotFound();
    }

    /// <summary>
    /// Updates a product from the admin panel.
    /// </summary>
    /// <param name="id">The product identifier.</param>
    /// <param name="dto">The updated values.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The updated product; otherwise, not found or bad request.</returns>
    [HttpPut("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(Product), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> Update(Guid id, [FromBody] UpdateProductDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var updated = await _service.UpdateAsync(id, dto, ct).ConfigureAwait(false);
        return updated is null ? NotFound() : Ok(updated);
    }
}
