using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DigitalGaming.Infrastructure.Persistence;

/// <summary>
/// Creates <see cref="AppDbContext"/> at design time (dotnet-ef). Never connects; only builds the model.
/// </summary>
public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    /// <inheritdoc/>
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=dm_design;Username=design;Password=design")
            .Options;
        return new AppDbContext(options);
    }
}
