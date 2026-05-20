using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehiclePartsManagementSystem.Infrastructure.Migrations
{
    /// <summary>
    /// Adds purchase invoice metadata columns expected by the application layer.
    /// </summary>
    public partial class PurchaseInvoiceFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "InvoiceNumber" text NOT NULL DEFAULT '';
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "Notes" text NOT NULL DEFAULT '';
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "ProcessedBy" text NOT NULL DEFAULT '';
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "PurchaseInvoices" DROP COLUMN IF EXISTS "CreatedAt";
                ALTER TABLE "PurchaseInvoices" DROP COLUMN IF EXISTS "ProcessedBy";
                ALTER TABLE "PurchaseInvoices" DROP COLUMN IF EXISTS "Notes";
                ALTER TABLE "PurchaseInvoices" DROP COLUMN IF EXISTS "InvoiceNumber";
                """);
        }
    }
}
