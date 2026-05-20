
using System.Text;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using FluentValidation;
using FluentValidation.AspNetCore;
using VehiclePartsManagementSystem.Api.Middleware;
using VehiclePartsManagementSystem.Application.Validators;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;
using VehiclePartsManagementSystem.Infrastructure.Data;
using VehiclePartsManagementSystem.Infrastructure.Repositories;
using VehiclePartsManagementSystem.Infrastructure.Services;

namespace VehiclePartsManagementSystem.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            builder.Services.AddFluentValidationAutoValidation();
            builder.Services.AddValidatorsFromAssemblyContaining<LoginDtoValidator>();
            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                    policy
                        // Allow Vite dev server / local dev tools on localhost.
                        // This avoids common "frontend and backend not connected" CORS blocks
                        // when the frontend runs on https or a different local port.
                        .SetIsOriginAllowed(origin =>
                        {
                            if (string.IsNullOrWhiteSpace(origin)) return false;
                            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
                            return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                                   || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);
                        })
                        .AllowAnyHeader()
                        .AllowAnyMethod());
            });

            builder.Services.AddDbContext<AppDbContext>(options =>
                options
                    .UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
                    // Some environments treat "pending model changes" as an error, which prevents
                    // applying migrations and starting the dev server.
                    .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

            // Services
            builder.Services.AddScoped<IPartService, PartService>();
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<IStaffRepository, StaffRepository>();
            builder.Services.AddScoped<IStaffService, StaffService>();
            builder.Services.AddScoped<IVendorRepository, VendorRepository>();
            builder.Services.AddScoped<IVendorService, VendorService>();
            builder.Services.AddScoped<IPurchaseService, PurchaseService>();
            builder.Services.AddScoped<ICustomerService, CustomerService>();
            builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
            builder.Services.AddScoped<ICustomerVehicleService, CustomerVehicleService>();
            builder.Services.AddScoped<IPartRequestService, PartRequestService>();
            builder.Services.AddScoped<IReviewService, ReviewService>();
            builder.Services.AddScoped<ICommunityReviewService, CommunityReviewService>();
            builder.Services.AddScoped<ICustomerReportService, CustomerReportService>();
            builder.Services.AddScoped<ITopSpendersExportService, TopSpendersExportService>();
            builder.Services.AddScoped<IRegularCustomersExportService, RegularCustomersExportService>();
            builder.Services.AddScoped<IPendingCreditsExportService, PendingCreditsExportService>();
            builder.Services.AddScoped<IAppointmentsExportService, AppointmentsExportService>();
            builder.Services.AddScoped<ISalesService, SalesService>();
            builder.Services.AddScoped<IReportService, ReportService>();
            builder.Services.AddScoped<IEmailService, EmailService>();
            builder.Services.AddScoped<ICreditReminderService, CreditReminderService>();
            builder.Services.AddScoped<INotificationService, NotificationService>();
            builder.Services.AddScoped<IInventoryNotificationService, InventoryNotificationService>();
            builder.Services.AddScoped<IFuelUsageService, FuelUsageService>();
            builder.Services.AddScoped<IAiPredictionService, AiPredictionService>();
            builder.Services.AddScoped<IDemoDataSeeder, DemoDataSeeder>();
            builder.Services.AddHostedService<OverduePaymentService>();
            builder.Services.AddHostedService<InventoryNotificationBackgroundService>();

            // JWT Auth — JwtSettings is the canonical section; Jwt kept for older configs.
            var jwtSection = builder.Configuration.GetSection("JwtSettings");
            if (!jwtSection.Exists() || string.IsNullOrWhiteSpace(jwtSection["Key"]))
            {
                jwtSection = builder.Configuration.GetSection("Jwt");
            }

            var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("JWT key not configured (JwtSettings:Key).");

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    // Preserve ClaimTypes.Role so [Authorize(Roles = "Admin")] works with issued tokens.
                    options.MapInboundClaims = false;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtSection["Issuer"],
                        ValidAudience = jwtSection["Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                        RoleClaimType = System.Security.Claims.ClaimTypes.Role,
                        NameClaimType = System.Security.Claims.ClaimTypes.Name,
                    };
                });

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();

                // Keep local dev DB schema in sync with migrations.
                try
                {
                    using var scope = app.Services.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    // Apply migrations incrementally so we can recover from a common dev-state:
                    // schema exists but __EFMigrationsHistory is missing entries.
                    var migrator = db.GetService<IMigrator>();

                    while (true)
                    {
                        var pending = db.Database.GetPendingMigrations().ToList();
                        if (pending.Count == 0) break;

                        var nextMigration = pending[0];
                        try
                        {
                            migrator.Migrate(nextMigration);
                        }
                        catch (PostgresException pg) when (pg.SqlState is "42P07" or "42703")
                        {
                            // "relation already exists" -> mark as applied and continue.
                            // "column does not exist" -> migration likely already applied or schema drifted.
                            var productVersion = ProductInfo.GetVersion();
                            db.Database.ExecuteSqlRaw(
                                """
                                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                                VALUES ({0}, {1})
                                ON CONFLICT ("MigrationId") DO NOTHING;
                                """,
                                nextMigration,
                                productVersion
                            );
                        }
                    }

                    // Last-resort dev safety: if the DB schema drifted, ensure the columns
                    // the running app expects exist so the API doesn't crash.
                    db.Database.ExecuteSqlRaw(
                        """
                        ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "Phone" text NOT NULL DEFAULT '';
                        ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "Address" text NOT NULL DEFAULT '';
                        ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "PasswordHash" text NOT NULL DEFAULT '';
                        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Customers_Email" ON "Customers" ("Email");
                        ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "IsSent" boolean NOT NULL DEFAULT false;
                        ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "SentDate" timestamp with time zone NULL;
                        """);

                    EnsureStaffSchema(db);
                    EnsureCustomersSchema(db);
                    EnsureVendorSchema(db);
                    EnsurePurchaseSchema(db);
                    EnsurePartsSchema(db);
                    EnsureSalesSchema(db);
                    EnsureInvoicesSchema(db);
                    EnsureInvoiceCreditSchema(db);
                    EnsureInvoicePaymentsSchema(db);
                    EnsureFeature15Schema(db);
                    EnsureInventoryNotificationsSchema(db);
                    EnsureEmailLogsSchema(db);
                    EnsureEmailReminderLogsSchema(db);
                    EnsureServiceAppointmentsSchema(db);
                    EnsureDemoDataSchema(db);
                    SeedDefaultAdminAsync(db).GetAwaiter().GetResult();
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Database migration failed: {ex.Message}");
                }
            }

            // After migrations: legacy "Users"."Name" must be "Username" or EF LINQ emits u."Username"
            // and PostgreSQL returns 42703.
            try
            {
                using var alignScope = app.Services.CreateScope();
                var alignDb = alignScope.ServiceProvider.GetRequiredService<AppDbContext>();
                alignDb.Database.ExecuteSqlRaw(
                    """
                    DO $$
                    BEGIN
                      IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'Name'
                      ) AND NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'Username'
                      ) THEN
                        ALTER TABLE "Users" RENAME COLUMN "Name" TO "Username";
                      END IF;
                    END $$;
                    """);
                alignDb.Database.ExecuteSqlRaw(
                    """
                    DO $$
                    BEGIN
                      IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'Username'
                      ) THEN
                        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username" ON "Users" ("Username")';
                      END IF;
                    END $$;
                    """);

                EnsureStaffSchema(alignDb);

                EnsureCustomersSchema(alignDb);

                EnsureVendorSchema(alignDb);

                EnsurePurchaseSchema(alignDb);

                EnsurePartsSchema(alignDb);

                EnsureSalesSchema(alignDb);

                EnsureInvoicesSchema(alignDb);

                EnsureCustomerFeaturesSchema(alignDb);
                EnsurePartRequestsSchema(alignDb);
                SeedCommunityReviewsAsync(alignDb).GetAwaiter().GetResult();

                EnsureInvoiceCreditSchema(alignDb);

                EnsureInvoicePaymentsSchema(alignDb);

                EnsureFeature15Schema(alignDb);

                EnsureInventoryNotificationsSchema(alignDb);

                EnsureServiceAppointmentsSchema(alignDb);

                EnsureDemoDataSchema(alignDb);

                EnsureEmailReminderLogsSchema(alignDb);

                var seeder = alignScope.ServiceProvider.GetRequiredService<IDemoDataSeeder>();
                seeder.EnsureMinimumTestDataAsync().GetAwaiter().GetResult();

                if (app.Environment.IsDevelopment()
                    && app.Configuration.GetValue("Database:AutoSeedDemoData", true))
                {
                    seeder.SeedAsync(force: false).GetAwaiter().GetResult();
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Database schema alignment: {ex.Message}");
            }

            // Dev profile is often HTTP-only; redirecting POST /api/Auth/login to HTTPS can break sign-in.
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseCors("AllowFrontend");

            app.UseAuthentication();
            app.UseAuthorization();

            // Must run immediately before endpoints so controller exceptions are mapped to JSON errors.
            app.UseMiddleware<ExceptionHandlingMiddleware>();

            app.MapControllers();

            app.Run();
        }

        /// <summary>
        /// Align Sales table columns expected by EF entities and reporting queries.
        /// </summary>
        private static void EnsureSalesSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'Sales'
                  ) THEN
                    ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "Date" timestamp with time zone NOT NULL DEFAULT NOW();
                    ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "OriginalTotalAmount" numeric NOT NULL DEFAULT 0;
                    ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "DiscountAmount" numeric NOT NULL DEFAULT 0;
                    ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "TotalAmount" numeric NOT NULL DEFAULT 0;
                    ALTER TABLE "Sales" ADD COLUMN IF NOT EXISTS "CustomerId" integer NULL;
                  END IF;
                END $$;
                CREATE INDEX IF NOT EXISTS "IX_Sales_CustomerId" ON "Sales" ("CustomerId");

                DO $$
                DECLARE
                  col record;
                BEGIN
                  FOR col IN
                    SELECT table_name, column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name IN ('Sales', 'SaleItems')
                      AND (
                        (table_name = 'Sales' AND column_name NOT IN ('Id', 'CustomerId', 'Date', 'OriginalTotalAmount', 'DiscountAmount', 'TotalAmount'))
                        OR (table_name = 'SaleItems' AND column_name NOT IN ('Id', 'SaleId', 'PartId', 'Quantity', 'Price'))
                      )
                      AND is_nullable = 'NO'
                  LOOP
                    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL', col.table_name, col.column_name);
                  END LOOP;
                END $$;
                """);
        }

        /// <summary>
        /// Customer vehicles, part requests, and reviews tables.
        /// </summary>
        private static void EnsureCustomerFeaturesSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS "CustomerVehicles" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "CustomerId" integer NOT NULL,
                    "VehicleNumber" text NOT NULL,
                    "Brand" text NOT NULL,
                    "Model" text NOT NULL,
                    "Year" integer NOT NULL,
                    "Mileage" integer NOT NULL,
                    CONSTRAINT "PK_CustomerVehicles" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_CustomerVehicles_Customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_CustomerVehicles_CustomerId" ON "CustomerVehicles" ("CustomerId");
                CREATE INDEX IF NOT EXISTS "IX_CustomerVehicles_VehicleNumber" ON "CustomerVehicles" ("VehicleNumber");
                ALTER TABLE "CustomerVehicles" ADD COLUMN IF NOT EXISTS "Notes" text NULL;
                ALTER TABLE "CustomerVehicles" ADD COLUMN IF NOT EXISTS "Vin" text NULL;

                CREATE TABLE IF NOT EXISTS "PartRequests" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "CustomerId" integer NOT NULL,
                    "PartName" text NOT NULL,
                    "Description" text NOT NULL DEFAULT '',
                    "Status" text NOT NULL DEFAULT 'Pending',
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "UpdatedAt" timestamp with time zone NULL,
                    CONSTRAINT "PK_PartRequests" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_PartRequests_Customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_PartRequests_CustomerId" ON "PartRequests" ("CustomerId");
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "VehicleDetails" text NOT NULL DEFAULT '';
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "Quantity" integer NOT NULL DEFAULT 1;
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "ResponseNotes" text NULL;
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "VehicleId" integer NULL;
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "FulfilledAt" timestamp with time zone NULL;
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "FulfilledByStaffId" integer NULL;

                CREATE TABLE IF NOT EXISTS "Reviews" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "CustomerId" integer NOT NULL,
                    "Rating" integer NOT NULL,
                    "Comment" text NOT NULL,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_Reviews" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_Reviews_Customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_Reviews_CustomerId" ON "Reviews" ("CustomerId");
                ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "Title" text NULL;
                ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "ServiceType" text NULL;
                ALTER TABLE "Reviews" ADD COLUMN IF NOT EXISTS "Status" text NOT NULL DEFAULT 'Approved';
                UPDATE "Reviews" SET "Status" = 'Approved' WHERE "Status" IS NULL OR TRIM("Status") = '';
                UPDATE "Reviews" SET "ServiceType" = 'General Service' WHERE "ServiceType" IS NULL OR TRIM("ServiceType") = '';

                CREATE TABLE IF NOT EXISTS "CommunityReviews" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "CustomerId" integer NOT NULL,
                    "CustomerName" text NOT NULL,
                    "Rating" integer NOT NULL,
                    "ReviewText" text NOT NULL,
                    "Status" text NOT NULL DEFAULT 'Pending',
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_CommunityReviews" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_CommunityReviews_Customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_CommunityReviews_CustomerId" ON "CommunityReviews" ("CustomerId");

                CREATE TABLE IF NOT EXISTS "FuelUsageLogs" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "CustomerId" integer NOT NULL,
                    "VehicleId" integer NOT NULL,
                    "OdometerKm" integer NOT NULL,
                    "FuelAmountLiters" numeric NOT NULL DEFAULT 0,
                    "FuelType" text NOT NULL DEFAULT 'Petrol',
                    "FuelCost" numeric NOT NULL DEFAULT 0,
                    "LogDate" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "Notes" text NULL,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_FuelUsageLogs" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_FuelUsageLogs_Customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id") ON DELETE CASCADE,
                    CONSTRAINT "FK_FuelUsageLogs_CustomerVehicles_VehicleId" FOREIGN KEY ("VehicleId") REFERENCES "CustomerVehicles" ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_FuelUsageLogs_CustomerId" ON "FuelUsageLogs" ("CustomerId");
                CREATE INDEX IF NOT EXISTS "IX_FuelUsageLogs_VehicleId" ON "FuelUsageLogs" ("VehicleId");

                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260519180000_AddCustomerVehiclesPartRequestsReviews', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        /// <summary>
        /// Aligns PartRequests with the domain model and fixes legacy NOT NULL columns without defaults.
        /// </summary>
        private static void EnsurePartRequestsSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "PartName" text NOT NULL DEFAULT '';
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "Description" text NOT NULL DEFAULT '';
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "Status" text NOT NULL DEFAULT 'Pending';
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone NULL;
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "VehicleDetails" text NOT NULL DEFAULT '';
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "Quantity" integer NOT NULL DEFAULT 1;
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "ResponseNotes" text NULL;
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "VehicleId" integer NULL;
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "FulfilledAt" timestamp with time zone NULL;
                ALTER TABLE "PartRequests" ADD COLUMN IF NOT EXISTS "FulfilledByStaffId" integer NULL;

                UPDATE "PartRequests" SET "PartName" = '' WHERE "PartName" IS NULL;
                UPDATE "PartRequests" SET "Description" = '' WHERE "Description" IS NULL;
                UPDATE "PartRequests" SET "VehicleDetails" = '' WHERE "VehicleDetails" IS NULL;
                UPDATE "PartRequests" SET "Status" = 'Pending' WHERE "Status" IS NULL OR btrim("Status") = '';
                UPDATE "PartRequests" SET "Quantity" = 1 WHERE "Quantity" IS NULL OR "Quantity" < 1;

                ALTER TABLE "PartRequests" ALTER COLUMN "UpdatedAt" DROP NOT NULL;
                ALTER TABLE "PartRequests" ALTER COLUMN "FulfilledAt" DROP NOT NULL;
                ALTER TABLE "PartRequests" ALTER COLUMN "ResponseNotes" DROP NOT NULL;
                ALTER TABLE "PartRequests" ALTER COLUMN "VehicleId" DROP NOT NULL;
                ALTER TABLE "PartRequests" ALTER COLUMN "FulfilledByStaffId" DROP NOT NULL;

                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'PartRequests' AND column_name = 'Name'
                  ) AND NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'PartRequests' AND column_name = 'PartName'
                  ) THEN
                    ALTER TABLE "PartRequests" RENAME COLUMN "Name" TO "PartName";
                  END IF;
                END $$;

                DO $$
                DECLARE col record;
                BEGIN
                  FOR col IN
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'PartRequests'
                      AND is_nullable = 'NO'
                      AND column_default IS NULL
                      AND column_name NOT IN ('Id', 'CustomerId', 'CreatedAt')
                  LOOP
                    IF col.column_name = 'Quantity' THEN
                      EXECUTE format('ALTER TABLE "PartRequests" ALTER COLUMN %I SET DEFAULT 1', col.column_name);
                      EXECUTE format('UPDATE "PartRequests" SET %I = 1 WHERE %I IS NULL', col.column_name, col.column_name);
                    ELSIF col.column_name IN ('UpdatedAt', 'FulfilledAt', 'ResponseNotes', 'VehicleId', 'FulfilledByStaffId') THEN
                      EXECUTE format('ALTER TABLE "PartRequests" ALTER COLUMN %I DROP NOT NULL', col.column_name);
                    ELSE
                      EXECUTE format('ALTER TABLE "PartRequests" ALTER COLUMN %I SET DEFAULT ''''', col.column_name);
                      EXECUTE format('UPDATE "PartRequests" SET %I = '''' WHERE %I IS NULL', col.column_name, col.column_name);
                    END IF;
                  END LOOP;
                END $$;
                """);
        }

        /// <summary>
        /// Purchase invoices and line items — tables were missing from early DB bootstraps.
        /// </summary>
        private static void EnsurePurchaseSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS "PurchaseInvoices" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "VendorName" text NOT NULL,
                    "Date" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "TotalAmount" numeric NOT NULL DEFAULT 0,
                    "VendorId" integer NULL,
                    CONSTRAINT "PK_PurchaseInvoices" PRIMARY KEY ("Id")
                );

                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "VendorName" text NOT NULL DEFAULT '';
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "Date" timestamp with time zone NOT NULL DEFAULT NOW();
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "TotalAmount" numeric NOT NULL DEFAULT 0;
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "VendorId" integer NULL;
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "InvoiceNumber" text NOT NULL DEFAULT '';
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "Notes" text NOT NULL DEFAULT '';
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "ProcessedBy" text NOT NULL DEFAULT '';
                ALTER TABLE "PurchaseInvoices" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();

                CREATE INDEX IF NOT EXISTS "IX_PurchaseInvoices_VendorId" ON "PurchaseInvoices" ("VendorId");

                CREATE TABLE IF NOT EXISTS "InventoryStockLogs" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "PartId" integer NOT NULL,
                    "QuantityChange" integer NOT NULL,
                    "Reason" text NOT NULL DEFAULT '',
                    "ReferenceType" text NOT NULL DEFAULT '',
                    "ReferenceId" integer NULL,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_InventoryStockLogs" PRIMARY KEY ("Id")
                );

                CREATE INDEX IF NOT EXISTS "IX_InventoryStockLogs_PartId_CreatedAt"
                    ON "InventoryStockLogs" ("PartId", "CreatedAt");

                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'Parts'
                  ) AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_InventoryStockLogs_Parts_PartId'
                  ) THEN
                    ALTER TABLE "InventoryStockLogs"
                      ADD CONSTRAINT "FK_InventoryStockLogs_Parts_PartId"
                      FOREIGN KEY ("PartId") REFERENCES "Parts" ("Id") ON DELETE CASCADE;
                  END IF;
                END $$;

                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260526120000_PurchaseInvoiceFields', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;

                CREATE TABLE IF NOT EXISTS "PurchaseItems" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "PurchaseInvoiceId" integer NOT NULL,
                    "PartId" integer NOT NULL,
                    "Quantity" integer NOT NULL,
                    "Price" numeric NOT NULL,
                    CONSTRAINT "PK_PurchaseItems" PRIMARY KEY ("Id")
                );

                CREATE INDEX IF NOT EXISTS "IX_PurchaseItems_PurchaseInvoiceId" ON "PurchaseItems" ("PurchaseInvoiceId");
                CREATE INDEX IF NOT EXISTS "IX_PurchaseItems_PartId" ON "PurchaseItems" ("PartId");

                DO $$
                BEGIN
                  IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseItems_PurchaseInvoices_PurchaseInvoiceId'
                  ) THEN
                    ALTER TABLE "PurchaseItems"
                      ADD CONSTRAINT "FK_PurchaseItems_PurchaseInvoices_PurchaseInvoiceId"
                      FOREIGN KEY ("PurchaseInvoiceId") REFERENCES "PurchaseInvoices" ("Id") ON DELETE CASCADE;
                  END IF;
                END $$;

                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'Parts'
                  ) AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseItems_Parts_PartId'
                  ) THEN
                    ALTER TABLE "PurchaseItems"
                      ADD CONSTRAINT "FK_PurchaseItems_Parts_PartId"
                      FOREIGN KEY ("PartId") REFERENCES "Parts" ("Id") ON DELETE RESTRICT;
                  END IF;
                END $$;

                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'Vendors'
                  ) AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_PurchaseInvoices_Vendors_VendorId'
                  ) THEN
                    ALTER TABLE "PurchaseInvoices"
                      ADD CONSTRAINT "FK_PurchaseInvoices_Vendors_VendorId"
                      FOREIGN KEY ("VendorId") REFERENCES "Vendors" ("Id") ON DELETE RESTRICT;
                  END IF;
                END $$;

                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260519120000_EnhancePurchaseInvoice', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;

                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260520100000_EnsurePurchaseTables', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        /// <summary>
        /// Feature 5: align Vendors table with ContactPerson, Phone, CreatedAt, and unique email.
        /// </summary>
        private static void EnsureVendorSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
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
                    ALTER TABLE "Vendors" ADD COLUMN IF NOT EXISTS "Notes" text NOT NULL DEFAULT '';
                    ALTER TABLE "Vendors" ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT true;
                    ALTER TABLE "Vendors" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
                  END IF;
                END $$;
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Vendors_Email" ON "Vendors" ("Email");
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "VendorId" integer NULL;
                CREATE INDEX IF NOT EXISTS "IX_Parts_VendorId" ON "Parts" ("VendorId");
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260518140000_UpdateVendorFeature5', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        /// <summary>
        /// Ensures Invoices table matches EF entity (CreatedDate, InvoiceNumber, credit fields).
        /// </summary>
        private static void EnsureInvoicesSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'Invoices'
                  ) THEN
                    IF EXISTS (
                      SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = 'Invoices' AND column_name = 'CreatedAt'
                    ) AND NOT EXISTS (
                      SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = 'Invoices' AND column_name = 'CreatedDate'
                    ) THEN
                      ALTER TABLE "Invoices" RENAME COLUMN "CreatedAt" TO "CreatedDate";
                    END IF;
                  END IF;
                END $$;

                CREATE TABLE IF NOT EXISTS "Invoices" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "SaleId" integer NOT NULL,
                    "InvoiceNumber" text NOT NULL DEFAULT '',
                    "CreatedDate" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "IsSent" boolean NOT NULL DEFAULT false,
                    "SentDate" timestamp with time zone NULL,
                    "IsPaid" boolean NOT NULL DEFAULT false,
                    "ReminderSentCount" integer NOT NULL DEFAULT 0,
                    "LastReminderDate" timestamp with time zone NULL,
                    "PaymentStatus" text NOT NULL DEFAULT 'Credit',
                    "DueDate" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "PaidAmount" numeric NOT NULL DEFAULT 0,
                    "BalanceAmount" numeric NOT NULL DEFAULT 0,
                    CONSTRAINT "PK_Invoices" PRIMARY KEY ("Id")
                );

                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "SaleId" integer NOT NULL DEFAULT 0;
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "InvoiceNumber" text NOT NULL DEFAULT '';
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "CreatedDate" timestamp with time zone NOT NULL DEFAULT NOW();
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "IsSent" boolean NOT NULL DEFAULT false;
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "SentDate" timestamp with time zone NULL;
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "IsPaid" boolean NOT NULL DEFAULT false;
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "ReminderSentCount" integer NOT NULL DEFAULT 0;
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "LastReminderDate" timestamp with time zone NULL;
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "PaymentStatus" text NOT NULL DEFAULT 'Credit';
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "DueDate" timestamp with time zone NOT NULL DEFAULT NOW();
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "PaidAmount" numeric NOT NULL DEFAULT 0;
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "BalanceAmount" numeric NOT NULL DEFAULT 0;

                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Invoices_InvoiceNumber" ON "Invoices" ("InvoiceNumber");
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Invoices_SaleId" ON "Invoices" ("SaleId");

                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'Sales'
                  ) AND NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_Invoices_Sales_SaleId'
                  ) THEN
                    ALTER TABLE "Invoices"
                      ADD CONSTRAINT "FK_Invoices_Sales_SaleId"
                      FOREIGN KEY ("SaleId") REFERENCES "Sales" ("Id") ON DELETE CASCADE;
                  END IF;
                END $$;

                DO $$
                DECLARE
                  col record;
                BEGIN
                  FOR col IN
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'Invoices'
                      AND column_name NOT IN (
                        'Id', 'SaleId', 'InvoiceNumber', 'CreatedDate', 'IsSent', 'SentDate',
                        'IsPaid', 'ReminderSentCount', 'LastReminderDate', 'PaymentStatus',
                        'DueDate', 'PaidAmount', 'BalanceAmount')
                      AND is_nullable = 'NO'
                  LOOP
                    EXECUTE format('ALTER TABLE "Invoices" ALTER COLUMN %I DROP NOT NULL', col.column_name);
                  END LOOP;
                END $$;

                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260521150000_AlignInvoiceSalesPartsSchema', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        /// <summary>
        /// Align Customers table with EF entity (Phone vs legacy PhoneNumber).
        /// </summary>
        private static void EnsureCustomersSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'Customers'
                  ) THEN
                    ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "Name" text NOT NULL DEFAULT '';
                    ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "Email" text NOT NULL DEFAULT '';
                    ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "Phone" text NOT NULL DEFAULT '';
                    ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "Address" text NOT NULL DEFAULT '';
                    ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "PasswordHash" text NOT NULL DEFAULT '';
                    ALTER TABLE "Customers" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
                    UPDATE "Customers" c
                    SET "CreatedAt" = (
                      SELECT MIN(s."Date") FROM "Sales" s WHERE s."CustomerId" = c."Id"
                    )
                    WHERE EXISTS (SELECT 1 FROM "Sales" s WHERE s."CustomerId" = c."Id");

                    IF EXISTS (
                      SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = 'Customers' AND column_name = 'PhoneNumber'
                    ) AND EXISTS (
                      SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = 'Customers' AND column_name = 'Phone'
                    ) THEN
                      UPDATE "Customers"
                      SET "Phone" = COALESCE(NULLIF("Phone", ''), "PhoneNumber")
                      WHERE "Phone" IS NULL OR "Phone" = '';
                      ALTER TABLE "Customers" DROP COLUMN "PhoneNumber";
                    ELSIF EXISTS (
                      SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = 'Customers' AND column_name = 'PhoneNumber'
                    ) AND NOT EXISTS (
                      SELECT 1 FROM information_schema.columns
                      WHERE table_schema = 'public' AND table_name = 'Customers' AND column_name = 'Phone'
                    ) THEN
                      ALTER TABLE "Customers" RENAME COLUMN "PhoneNumber" TO "Phone";
                    END IF;
                  END IF;
                END $$;

                DO $$
                DECLARE
                  col record;
                BEGIN
                  FOR col IN
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'Customers'
                      AND column_name NOT IN ('Id', 'Name', 'Email', 'Phone', 'Address', 'PasswordHash', 'CreatedAt')
                      AND is_nullable = 'NO'
                  LOOP
                    EXECUTE format('ALTER TABLE "Customers" ALTER COLUMN %I DROP NOT NULL', col.column_name);
                  END LOOP;
                END $$;

                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Customers_Email" ON "Customers" ("Email");
                """);
        }

        /// <summary>
        /// Ensures Parts table matches EF entity.
        /// </summary>
        private static void EnsurePartsSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS "Parts" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "Name" text NOT NULL DEFAULT '',
                    "Description" text NOT NULL DEFAULT '',
                    "Price" numeric NOT NULL DEFAULT 0,
                    "Quantity" integer NOT NULL DEFAULT 0,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "VendorId" integer NULL,
                    CONSTRAINT "PK_Parts" PRIMARY KEY ("Id")
                );

                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "Name" text NOT NULL DEFAULT '';
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "Description" text NOT NULL DEFAULT '';
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "Price" numeric NOT NULL DEFAULT 0;
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "Quantity" integer NOT NULL DEFAULT 0;
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "VendorId" integer NULL;
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "PartNumber" text NULL;
                UPDATE "Parts"
                SET "PartNumber" = 'VP-LEGACY-' || LPAD("Id"::text, 4, '0')
                WHERE "PartNumber" IS NULL OR btrim("PartNumber") = '';
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "Category" text NULL;
                UPDATE "Parts"
                SET "Category" = 'General'
                WHERE "Category" IS NULL OR btrim("Category") = '';
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT true;
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "CriticalStockLevel" integer NOT NULL DEFAULT 3;
                ALTER TABLE "Parts" ADD COLUMN IF NOT EXISTS "CostPrice" numeric NOT NULL DEFAULT 0;

                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'Parts' AND column_name = 'VendorId'
                  ) THEN
                    ALTER TABLE "Parts" ALTER COLUMN "VendorId" DROP NOT NULL;
                  END IF;
                END $$;

                CREATE INDEX IF NOT EXISTS "IX_Parts_VendorId" ON "Parts" ("VendorId");

                DO $$
                DECLARE
                  col record;
                BEGIN
                  FOR col IN
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'Parts'
                      AND column_name NOT IN ('Id', 'Name', 'Description', 'Price', 'Quantity', 'CreatedAt', 'VendorId')
                      AND is_nullable = 'NO'
                  LOOP
                    EXECUTE format('ALTER TABLE "Parts" ALTER COLUMN %I DROP NOT NULL', col.column_name);
                  END LOOP;
                END $$;
                """);
        }

        private static void EnsureInvoiceCreditSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "PaymentStatus" text NOT NULL DEFAULT 'Credit';
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "DueDate" timestamp with time zone NOT NULL DEFAULT NOW();
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "PaidAmount" numeric NOT NULL DEFAULT 0;
                ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "BalanceAmount" numeric NOT NULL DEFAULT 0;
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260519200000_InvoiceCreditTracking', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        private static void EnsureInvoicePaymentsSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS "InvoicePayments" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "InvoiceId" integer NOT NULL,
                    "Amount" numeric NOT NULL,
                    "PaymentMethod" text NOT NULL DEFAULT 'Cash',
                    "Notes" text NULL,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_InvoicePayments" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_InvoicePayments_Invoices_InvoiceId" FOREIGN KEY ("InvoiceId")
                        REFERENCES "Invoices" ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_InvoicePayments_InvoiceId" ON "InvoicePayments" ("InvoiceId");
                ALTER TABLE "InvoicePayments" ADD COLUMN IF NOT EXISTS "StaffId" integer NULL;
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260522120000_InvoicePayments', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        private static void EnsureInventoryNotificationsSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS "InventoryNotifications" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "PartId" integer NOT NULL,
                    "Message" text NOT NULL DEFAULT '',
                    "Severity" text NOT NULL DEFAULT 'Warning',
                    "IsRead" boolean NOT NULL DEFAULT false,
                    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_InventoryNotifications" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_InventoryNotifications_Parts_PartId" FOREIGN KEY ("PartId")
                        REFERENCES "Parts" ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_InventoryNotifications_PartId_IsRead"
                    ON "InventoryNotifications" ("PartId", "IsRead");
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260524120000_InventoryNotifications', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        /// <summary>
        /// Feature 15: ensure Invoices and Notifications tables are aligned on startup.
        /// </summary>
        private static void EnsureFeature15Schema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'Invoices'
                  ) THEN
                    ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "IsPaid" boolean NOT NULL DEFAULT false;
                    ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "ReminderSentCount" integer NOT NULL DEFAULT 0;
                    ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "LastReminderDate" timestamp with time zone NULL;
                  END IF;
                END $$;

                CREATE TABLE IF NOT EXISTS "Notifications" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "Title" text NOT NULL,
                    "Message" text NOT NULL,
                    "Type" text NOT NULL,
                    "ReferenceId" text NOT NULL,
                    "IsRead" boolean NOT NULL,
                    "CreatedAt" timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id")
                );
                """);
        }

        /// <summary>
        /// Overdue payment reminder email audit log (admin monitoring).
        /// </summary>
        private static void EnsureEmailReminderLogsSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS "EmailReminderLogs" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "CustomerId" integer NOT NULL,
                    "CreditPaymentId" integer NOT NULL,
                    "Email" text NOT NULL,
                    "SentAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "Status" text NOT NULL DEFAULT 'Sent',
                    "ErrorMessage" text NULL,
                    CONSTRAINT "PK_EmailReminderLogs" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_EmailReminderLogs_Customers_CustomerId" FOREIGN KEY ("CustomerId")
                        REFERENCES "Customers" ("Id") ON DELETE CASCADE,
                    CONSTRAINT "FK_EmailReminderLogs_Invoices_CreditPaymentId" FOREIGN KEY ("CreditPaymentId")
                        REFERENCES "Invoices" ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_EmailReminderLogs_CreditPaymentId"
                    ON "EmailReminderLogs" ("CreditPaymentId");
                CREATE INDEX IF NOT EXISTS "IX_EmailReminderLogs_CustomerId_SentAt"
                    ON "EmailReminderLogs" ("CustomerId", "SentAt");
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260520140000_EmailReminderLogs', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        /// <summary>
        /// Credit reminder email audit log.
        /// </summary>
        private static void EnsureEmailLogsSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS "EmailLogs" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "CustomerId" integer NOT NULL,
                    "InvoiceId" integer NOT NULL,
                    "EmailType" text NOT NULL,
                    "SentAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                    "Status" text NOT NULL DEFAULT 'Sent',
                    "ErrorMessage" text NULL,
                    "IsAutomatic" boolean NOT NULL DEFAULT false,
                    CONSTRAINT "PK_EmailLogs" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_EmailLogs_Customers_CustomerId" FOREIGN KEY ("CustomerId")
                        REFERENCES "Customers" ("Id") ON DELETE CASCADE,
                    CONSTRAINT "FK_EmailLogs_Invoices_InvoiceId" FOREIGN KEY ("InvoiceId")
                        REFERENCES "Invoices" ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_EmailLogs_InvoiceId" ON "EmailLogs" ("InvoiceId");
                CREATE INDEX IF NOT EXISTS "IX_EmailLogs_CustomerId" ON "EmailLogs" ("CustomerId");
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260523100000_EmailLogs', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        /// <summary>
        /// Service appointments table for booking and customer history.
        /// </summary>
        private static void EnsureServiceAppointmentsSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS "ServiceAppointments" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "CustomerId" integer NOT NULL,
                    "ServiceType" text NOT NULL,
                    "Status" text NOT NULL DEFAULT 'Scheduled',
                    "Date" timestamp with time zone NOT NULL DEFAULT NOW(),
                    CONSTRAINT "PK_ServiceAppointments" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_ServiceAppointments_Customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("Id") ON DELETE RESTRICT
                );
                CREATE INDEX IF NOT EXISTS "IX_ServiceAppointments_CustomerId" ON "ServiceAppointments" ("CustomerId");
                ALTER TABLE "ServiceAppointments" ADD COLUMN IF NOT EXISTS "VehicleNumber" text NULL;
                ALTER TABLE "ServiceAppointments" ADD COLUMN IF NOT EXISTS "Notes" text NULL;
                ALTER TABLE "ServiceAppointments" ADD COLUMN IF NOT EXISTS "EstimatedCost" numeric NULL;
                ALTER TABLE "ServiceAppointments" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
                UPDATE "ServiceAppointments" SET "CreatedAt" = "Date" WHERE "CreatedAt" IS NULL;

                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260521120000_AddServiceAppointments', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        /// <summary>
        /// Feature 2: ensure Staff table exists when AddStaff migration was not applied yet.
        /// </summary>
        private static void EnsureStaffSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS "Staff" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "FullName" text NOT NULL,
                    "Email" text NOT NULL,
                    "Phone" text NOT NULL,
                    "PasswordHash" text NOT NULL,
                    "Role" text NOT NULL,
                    "IsActive" boolean NOT NULL,
                    "CreatedAt" timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_Staff" PRIMARY KEY ("Id")
                );
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Staff_Email" ON "Staff" ("Email");
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260518120000_AddStaff', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        /// <summary>
        /// Ensures at least one admin exists for first-time local development.
        /// </summary>
        private static async Task SeedDefaultAdminAsync(AppDbContext db)
        {
            if (await db.Staff.AnyAsync())
            {
                return;
            }

            db.Staff.Add(new Staff
            {
                FullName = "System Administrator",
                Email = "admin@partshub.local",
                Phone = "+10000000000",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            });

            await db.SaveChangesAsync();
            Console.WriteLine("Seeded default admin: admin@partshub.local / Admin@123");
        }

        private static void EnsureDemoDataSchema(AppDbContext db)
        {
            db.Database.ExecuteSqlRaw(
                """
                CREATE TABLE IF NOT EXISTS "AuditLogs" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "Timestamp" timestamp with time zone NOT NULL,
                    "Action" text NOT NULL,
                    "Details" text NOT NULL,
                    "Entity" text NOT NULL,
                    "EntityType" text NOT NULL,
                    "PerformedBy" text NOT NULL,
                    CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id")
                );
                CREATE INDEX IF NOT EXISTS "IX_AuditLogs_Timestamp" ON "AuditLogs" ("Timestamp");
                CREATE INDEX IF NOT EXISTS "IX_AuditLogs_Action" ON "AuditLogs" ("Action");

                CREATE TABLE IF NOT EXISTS "BackgroundJobRuns" (
                    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
                    "JobKey" text NOT NULL,
                    "JobName" text NOT NULL,
                    "Queue" text NOT NULL,
                    "Status" text NOT NULL,
                    "StartedAt" timestamp with time zone NOT NULL,
                    "CompletedAt" timestamp with time zone NULL,
                    "DurationMs" integer NULL,
                    "Message" text NULL,
                    CONSTRAINT "PK_BackgroundJobRuns" PRIMARY KEY ("Id")
                );
                CREATE INDEX IF NOT EXISTS "IX_BackgroundJobRuns_JobKey_StartedAt"
                    ON "BackgroundJobRuns" ("JobKey", "StartedAt");
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                VALUES ('20260520120000_DemoDataTables', '9.0.4')
                ON CONFLICT ("MigrationId") DO NOTHING;
                """);
        }

        private static async Task SeedCommunityReviewsAsync(AppDbContext db)
        {
            if (await db.CommunityReviews.AnyAsync(r => r.Status == "Approved"))
            {
                return;
            }

            var customerId = await db.Customers.OrderBy(c => c.Id).Select(c => c.Id).FirstOrDefaultAsync();
            if (customerId == 0)
            {
                return;
            }

            var now = DateTime.UtcNow;
            var samples = new[]
            {
                ("Sandra T.", 5, "Battery service experience has been fantastic. Thanks to the team at AutoParts Plus!"),
                ("Anthony T.", 5, "Great parts and friendly staff. Highly recommended!"),
                ("Matthew K.", 4, "Fast service and fair pricing. Could improve communication."),
                ("Margaret W.", 5, "Our tire replacement was handled fast the same day."),
                ("Patricia M.", 3, "Service was okay. Waiting reception but got the job done."),
            };

            foreach (var (name, rating, text) in samples)
            {
                db.CommunityReviews.Add(new CommunityReview
                {
                    CustomerId = customerId,
                    CustomerName = name,
                    Rating = rating,
                    ReviewText = text,
                    Status = "Approved",
                    CreatedAt = now.AddDays(-Random.Shared.Next(1, 45)),
                });
            }

            await db.SaveChangesAsync();
        }
    }
}
