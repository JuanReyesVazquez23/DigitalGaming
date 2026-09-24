using DigitalGaming.Application.DTOs;
using DigitalGaming.Core.Interfaces;
using DigitalGaming.Core.Models;

namespace DigitalGaming.Application.Services;

/// <summary>
/// Implements catalog business rules (validation + creation).
/// </summary>
/// <remarks>Layer: Application.</remarks>
/// <param name="repository">The product repository.</param>
public sealed class ProductService(IProductRepository repository) : IProductService
{
    private readonly IProductRepository _repository = repository ?? throw new ArgumentNullException(nameof(repository));

    /// <inheritdoc/>
    public Task<IReadOnlyList<Product>> GetCatalogAsync(CancellationToken cancellationToken = default)
        => _repository.GetAllAsync(cancellationToken);

    /// <inheritdoc/>
    public Task<Product> CreateAsync(CreateProductDto dto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("El nombre es obligatorio.", nameof(dto));
        }

        if (dto.Price <= 0)
        {
            throw new ArgumentException("El precio debe ser mayor a 0.", nameof(dto));
        }

        var image = string.IsNullOrWhiteSpace(dto.ImageUrl)
            ? $"https://placehold.co/600x400/111111/E10600?text={Uri.EscapeDataString(dto.Name)}"
            : dto.ImageUrl.Trim();

        var product = new Product(
            Guid.NewGuid(),
            dto.Name.Trim(),
            dto.Price,
            dto.Category,
            image,
            dto.Description?.Trim() ?? string.Empty,
            Math.Max(0, dto.Stock),
            dto.Hidden);

        return _repository.AddAsync(product, cancellationToken);
    }

    /// <inheritdoc/>
    public Task<bool> RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Identificador inválido.", nameof(id));
        }

        return _repository.DeleteAsync(id, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<Product?> UpdateAsync(Guid id, UpdateProductDto dto, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dto);
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Identificador inválido.", nameof(id));
        }

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ArgumentException("El nombre es obligatorio.", nameof(dto));
        }

        if (dto.Price <= 0)
        {
            throw new ArgumentException("El precio debe ser mayor a 0.", nameof(dto));
        }

        var current = await _repository.GetByIdAsync(id, cancellationToken).ConfigureAwait(false);
        if (current is null)
        {
            return null;
        }

        var image = string.IsNullOrWhiteSpace(dto.ImageUrl)
            ? $"https://placehold.co/600x400/111111/E10600?text={Uri.EscapeDataString(dto.Name.Trim())}"
            : dto.ImageUrl.Trim();

        var updated = current with
        {
            Name = dto.Name.Trim(),
            Price = dto.Price,
            Category = dto.Category,
            ImageUrl = image,
            Description = dto.Description?.Trim() ?? string.Empty,
            Stock = Math.Max(0, dto.Stock),
            Hidden = dto.Hidden,
        };

        return await _repository.UpdateAsync(updated, cancellationToken).ConfigureAwait(false);
    }
}
