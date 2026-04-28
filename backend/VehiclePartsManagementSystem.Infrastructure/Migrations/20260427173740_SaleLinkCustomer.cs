using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehiclePartsManagementSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SaleLinkCustomer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerName",
                table: "Sales");

            migrationBuilder.AddColumn<int>(
                name: "CustomerId",
                table: "Sales",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Sales"
                SET "CustomerId" = (SELECT "Id" FROM "Customers" ORDER BY "Id" LIMIT 1)
                WHERE "CustomerId" IS NULL
                  AND EXISTS (SELECT 1 FROM "Customers" LIMIT 1);
                """);

            migrationBuilder.Sql("""
                DELETE FROM "Invoices" WHERE "SaleId" IN (SELECT "Id" FROM "Sales" WHERE "CustomerId" IS NULL);
                DELETE FROM "SaleItems" WHERE "SaleId" IN (SELECT "Id" FROM "Sales" WHERE "CustomerId" IS NULL);
                DELETE FROM "Sales" WHERE "CustomerId" IS NULL;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "CustomerId",
                table: "Sales",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sales_CustomerId",
                table: "Sales",
                column: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sales_Customers_CustomerId",
                table: "Sales",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Sales_Customers_CustomerId",
                table: "Sales");

            migrationBuilder.DropIndex(
                name: "IX_Sales_CustomerId",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "Sales");

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "Sales",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
