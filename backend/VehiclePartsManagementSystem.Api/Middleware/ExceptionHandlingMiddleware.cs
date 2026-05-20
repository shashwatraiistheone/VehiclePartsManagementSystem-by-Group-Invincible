using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace VehiclePartsManagementSystem.Api.Middleware
{
    /// <summary>
    /// Maps domain/service exceptions to consistent JSON error responses.
    /// </summary>
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public ExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<ExceptionHandlingMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (UnauthorizedAccessException ex)
            {
                await WriteErrorAsync(context, HttpStatusCode.Unauthorized, ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                await WriteErrorAsync(context, HttpStatusCode.NotFound, ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                await WriteErrorAsync(context, HttpStatusCode.BadRequest, ex.Message);
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
            {
                await WriteErrorAsync(context, HttpStatusCode.BadRequest, "A record with this value already exists.");
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23502")
            {
                _logger.LogError(ex, "NOT NULL constraint violation on {Table}.{Column}", pg.TableName, pg.ColumnName);
                var message = _environment.IsDevelopment() && !string.IsNullOrWhiteSpace(pg.ColumnName)
                    ? $"Required database column \"{pg.ColumnName}\" is missing a value. Restart the API to apply schema updates."
                    : "Required data is missing for this record. Restart the API if the database was recently updated.";
                await WriteErrorAsync(context, HttpStatusCode.BadRequest, message);
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true
                || ex.InnerException?.Message.Contains("unique", StringComparison.OrdinalIgnoreCase) == true)
            {
                await WriteErrorAsync(context, HttpStatusCode.BadRequest, "A record with this email already exists.");
            }
            catch (PostgresException pg)
            {
                _logger.LogError(pg, "PostgreSQL error {SqlState}", pg.SqlState);
                var message = pg.SqlState switch
                {
                    "42703" => "Database schema is out of date. Restart the API server to apply schema updates.",
                    "42P01" => "A required database table is missing. Restart the API server to create it.",
                    "23503" => "This operation conflicts with related records in the database.",
                    "23505" => "A record with this value already exists.",
                    _ => _environment.IsDevelopment()
                        ? $"Database error: {pg.MessageText}"
                        : "A database error occurred. Please try again or contact support.",
                };
                await WriteErrorAsync(context, HttpStatusCode.InternalServerError, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception");
                var message = _environment.IsDevelopment()
                    ? ex.Message
                    : "An unexpected error occurred.";
                await WriteErrorAsync(context, HttpStatusCode.InternalServerError, message);
            }
        }

        private static async Task WriteErrorAsync(HttpContext context, HttpStatusCode status, string message)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)status;

            var payload = new { message, status = (int)status };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
    }
}
