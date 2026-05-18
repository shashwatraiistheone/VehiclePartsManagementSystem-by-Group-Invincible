
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
            builder.Services.AddScoped<ISalesService, SalesService>();
            builder.Services.AddScoped<IReportService, ReportService>();
            builder.Services.AddScoped<IEmailService, EmailService>();

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
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = jwtSection["Issuer"],
                        ValidAudience = jwtSection["Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
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
                        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Customers_Email" ON "Customers" ("Email");
                        ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "IsSent" boolean NOT NULL DEFAULT false;
                        ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "SentDate" timestamp with time zone NULL;
                        """);

                    EnsureStaffSchema(db);
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

                EnsureVendorSchema(alignDb);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Database schema alignment: {ex.Message}");
            }

            app.UseMiddleware<ExceptionHandlingMiddleware>();

            app.UseExceptionHandler(errorApp =>
            {
                errorApp.Run(async context =>
                {
                    var feature = context.Features.Get<IExceptionHandlerFeature>();
                    var ex = feature?.Error;

                    var problem = new ProblemDetails
                    {
                        Title = "An unexpected error occurred",
                        Status = StatusCodes.Status500InternalServerError,
                        Detail = app.Environment.IsDevelopment() ? ex?.Message : null
                    };

                    context.Response.StatusCode = problem.Status.Value;
                    context.Response.ContentType = "application/problem+json";
                    await context.Response.WriteAsJsonAsync(problem);
                });
            });

            // Dev profile is often HTTP-only; redirecting POST /api/Auth/login to HTTPS can break sign-in.
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseCors("AllowFrontend");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
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
    }
}
