using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehiclePartsManagementSystem.Infrastructure.Migrations
{
    public partial class PartInventoryFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'Parts'
                  ) THEN
                    ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "PartNumber" text NOT NULL DEFAULT '';
                    ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "Category" text NOT NULL DEFAULT 'General';
                    ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT TRUE;
                  END IF;
                END $$;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Parts" DROP COLUMN IF EXISTS "IsActive";
                ALTER TABLE "Parts" DROP COLUMN IF EXISTS "Category";
                ALTER TABLE "Parts" DROP COLUMN IF EXISTS "PartNumber";
                """);
        }
    }
}
