using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using DigitalGaming.Application.Services;
using DigitalGaming.Core.Interfaces;
using DigitalGaming.Infrastructure.Persistence;
using DigitalGaming.Infrastructure.Repositories;
using DigitalGaming.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Controllers (API layer) — Why JsonStringEnumConverter: el admin TS envía "Consolas", no 0.
builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();

// --- CORS: el frontend de Vercel llama a este API desde otro origen. ---
// Orígenes desde Cors:AllowedOrigins (appsettings) o CORS_ORIGINS (env, separados por coma).
// Vacío = permite todo (solo desarrollo local).
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? builder.Configuration["CORS_ORIGINS"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? [];
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
{
    if (corsOrigins.Length == 0)
    {
        p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    }
    else
    {
        p.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod();
    }
}));

// --- JWT settings (strongly-typed). En producción usa variable de entorno Jwt__Key. ---
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();

// --- Datos: Postgres (Supabase) si hay connection string; si no, InMemory (dev local). ---
// Env var: ConnectionStrings__DefaultConnection = pooler de Supabase (puerto 6543) o directa (5432).
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var usePostgres = !string.IsNullOrWhiteSpace(connectionString);
if (usePostgres)
{
    builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString,
        npg => npg.EnableRetryOnFailure().CommandTimeout(30)));
    builder.Services.AddScoped<IProductRepository, EfProductRepository>();
    builder.Services.AddScoped<IUserRepository, EfUserRepository>();
    builder.Services.AddScoped<IOrderRepository, EfOrderRepository>();
    builder.Services.AddScoped<IRefreshTokenRepository, EfRefreshTokenRepository>();
}
else
{
    builder.Services.AddSingleton<IProductRepository, InMemoryProductRepository>();
    builder.Services.AddSingleton<IUserRepository, InMemoryUserRepository>();
    builder.Services.AddSingleton<IOrderRepository, InMemoryOrderRepository>();
    builder.Services.AddSingleton<IRefreshTokenRepository, InMemoryRefreshTokenRepository>();
}

// --- Layered DI: Infrastructure -> Application ---
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOrderService, OrderService>();

// --- Rate limiting: anti fuerza bruta en auth (10 req/min por IP). ---
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));
});

// --- JWT bearer auth: valida firma, emisor, audiencia y vida útil del token. ---
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

// --- Postgres: migra + seed en arranque (idempotente). ---
if (usePostgres)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db);
}

app.UseDefaultFiles(); // sirve wwwroot/index.html
app.UseStaticFiles();

app.UseCors();

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Fallback SPA: cualquier ruta no-API devuelve index.html
app.MapFallbackToFile("index.html");

app.Run();
