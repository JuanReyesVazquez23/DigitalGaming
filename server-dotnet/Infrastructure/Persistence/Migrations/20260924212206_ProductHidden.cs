using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DigitalGaming.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProductHidden : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Hidden",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // La preventa de GTA VI existía de antes: queda oculta del catálogo general.
            migrationBuilder.Sql("UPDATE \"Products\" SET \"Hidden\" = TRUE WHERE \"Name\" = 'GTA VI — Reserva preventa'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Hidden",
                table: "Products");
        }
    }
}
