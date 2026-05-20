using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehiclePartsManagementSystem.Infrastructure.Migrations
{
    public partial class VendorStatusAndNotes : Migration
    {
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
                    ALTER TABLE "Vendors" ADD COLUMN IF NOT EXISTS "Notes" text NOT NULL DEFAULT '';
                    ALTER TABLE "Vendors" ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT TRUE;
                  END IF;
                END $$;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Vendors" DROP COLUMN IF EXISTS "IsActive";
                ALTER TABLE "Vendors" DROP COLUMN IF EXISTS "Notes";
                """);
        }
    }
}
