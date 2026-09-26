using System.Globalization;
using System.Text;
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
    public async Task<PagedResult<Product>> GetPagedAsync(int limit, int offset, string? category, string? query, bool includeHidden, CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit <= 0 ? 12 : limit, 1, 50);
        offset = Math.Max(0, offset);

        var items = await _repository.GetAllAsync(cancellationToken).ConfigureAwait(false);

        Category? wanted = null;
        if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<Category>(category.Trim(), ignoreCase: true, out var parsed))
        {
            wanted = parsed;
        }

        var q = query?.Trim();
        var tokens = Normalize(q ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var filtered = items
            .Where(p => (includeHidden || !p.Hidden)
                && (!wanted.HasValue || p.Category == wanted.Value)
                && (tokens.Length == 0
                    || tokens.All(t => Normalize($"{p.Name} {p.Description} {p.Category}").Contains(t))))
            .ToList();

        var window = filtered.Skip(offset).Take(limit).ToList();
        return new PagedResult<Product>(window, filtered.Count, limit, offset);
    }

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

    /// <summary>
    /// Lowercases without diacritics or punctuation: "Audífono" matches "audifono".
    /// </summary>
    /// <param name="s">The raw text.</param>
    /// <returns>The normalized text.</returns>
    private static string Normalize(string s)
    {
        var formD = (s ?? "").ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(formD.Length);
        foreach (var c in formD)
        {
            // Why omitir (no espacio): "más" debe quedar "mas", no "ma s".
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        var spaced = new string(sb.ToString().Where(c => char.IsLetterOrDigit(c) || c == ' ').ToArray());
        return string.Join(' ', spaced.Split(' ', StringSplitOptions.RemoveEmptyEntries));
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
