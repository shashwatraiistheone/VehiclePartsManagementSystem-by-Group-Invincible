using System.Net;
using System.Text.Json;

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
