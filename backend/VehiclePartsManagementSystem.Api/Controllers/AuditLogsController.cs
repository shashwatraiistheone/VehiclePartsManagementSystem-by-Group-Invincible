using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff")]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AuditLogsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<AuditLogDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<AuditLogDto>>> GetAll(
            [FromQuery] string? action,
            [FromQuery] string? search,
            [FromQuery] int limit = 2000,
            CancellationToken cancellationToken = default)
        {
            limit = Math.Clamp(limit, 1, 5000);
            var query = _db.AuditLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(action) && !action.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(a => a.Action == action);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                query = query.Where(a =>
                    a.Details.ToLower().Contains(term) ||
                    a.Entity.ToLower().Contains(term) ||
                    a.PerformedBy.ToLower().Contains(term) ||
                    a.Action.ToLower().Contains(term));
            }

            var logs = await query
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    Timestamp = a.Timestamp,
                    Action = a.Action,
                    Details = a.Details,
                    Entity = a.Entity,
                    EntityType = a.EntityType,
                    PerformedBy = a.PerformedBy,
                })
                .ToListAsync(cancellationToken);

            return Ok(logs);
        }
    }
}
