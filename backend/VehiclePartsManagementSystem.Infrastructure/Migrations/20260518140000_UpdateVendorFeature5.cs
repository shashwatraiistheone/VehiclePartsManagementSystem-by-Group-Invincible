using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehiclePartsManagementSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateVendorFeature5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'Vendors'
                  ) THEN
                    IF EXISTS (
                      SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = 'Vendors' AND column_name = 'Contact'
                    ) AND NOT EXISTS (
                      SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = 'Vendors' AND column_name = 'ContactPerson'
                    ) THEN
                      ALTER TABLE "Vendors" RENAME COLUMN "Contact" TO "ContactPerson";
                    END IF;

                    ALTER TABLE "Vendors" ADD COLUMN IF NOT EXISTS "ContactPerson" text NOT NULL DEFAULT '';
                    ALTER TABLE "Vendors" ADD COLUMN IF NOT EXISTS "Phone" text NOT NULL DEFAULT '';
                    ALTER TABLE "Vendors" ADD COLUMN IF NOT EXISTS "Email" text NOT NULL DEFAULT '';
                    ALTER TABLE "Vendors" ADD COLUMN IF NOT EXISTS "Address" text NOT NULL DEFAULT '';
                    ALTER TABLE "Vendors" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
                  END IF;
                END $$;
                """);

            migrationBuilder.Sql(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Vendors_Email" ON "Vendors" ("Email");
                """);

            migrationBuilder.AddColumn<int>(
                name: "VendorId",
                table: "Parts",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Parts_VendorId",
                table: "Parts",
                column: "VendorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Parts_Vendors_VendorId",
                table: "Parts",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Parts_Vendors_VendorId",
                table: "Parts");

            migrationBuilder.DropIndex(
                name: "IX_Parts_VendorId",
                table: "Parts");

            migrationBuilder.DropColumn(
                name: "VendorId",
                table: "Parts");

            migrationBuilder.DropIndex(
                name: "IX_Vendors_Email",
                table: "Vendors");
        }
    }
}
