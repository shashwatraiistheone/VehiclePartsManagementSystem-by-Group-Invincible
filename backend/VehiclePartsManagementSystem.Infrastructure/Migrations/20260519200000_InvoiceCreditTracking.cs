using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehiclePartsManagementSystem.Infrastructure.Migrations
{
    public partial class InvoiceCreditTracking : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BalanceAmount",
                table: "Invoices",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "Invoices",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "Invoices",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "Invoices",
                type: "text",
                nullable: false,
                defaultValue: "Credit");

            migrationBuilder.Sql(
                """
                UPDATE "Invoices" i
                SET "BalanceAmount" = COALESCE(s."TotalAmount", 0),
                    "PaidAmount" = CASE WHEN i."IsPaid" THEN COALESCE(s."TotalAmount", 0) ELSE 0 END,
                    "PaymentStatus" = CASE WHEN i."IsPaid" THEN 'Paid' ELSE 'Credit' END,
                    "DueDate" = i."CreatedDate" + INTERVAL '30 days'
                FROM "Sales" s
                WHERE i."SaleId" = s."Id";
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "BalanceAmount", table: "Invoices");
            migrationBuilder.DropColumn(name: "DueDate", table: "Invoices");
            migrationBuilder.DropColumn(name: "PaidAmount", table: "Invoices");
            migrationBuilder.DropColumn(name: "PaymentStatus", table: "Invoices");
        }
    }
}
