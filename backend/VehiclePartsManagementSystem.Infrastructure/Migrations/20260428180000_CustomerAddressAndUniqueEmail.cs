using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehiclePartsManagementSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CustomerAddressAndUniqueEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Customers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(
                """
                UPDATE "Customers" SET "Email" = LOWER(TRIM("Email"));
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Email",
                table: "Customers",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Customers_Email",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Customers");
        }
    }
}
