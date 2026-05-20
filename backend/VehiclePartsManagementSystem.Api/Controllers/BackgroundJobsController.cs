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
    public class BackgroundJobsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public BackgroundJobsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(BackgroundJobsDashboardDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<BackgroundJobsDashboardDto>> GetDashboard(CancellationToken cancellationToken = default)
        {
            var runs = await _db.BackgroundJobRuns.AsNoTracking().ToListAsync(cancellationToken);
            if (runs.Count == 0)
            {
                return Ok(new BackgroundJobsDashboardDto());
            }

            var jobDefs = runs
                .GroupBy(r => r.JobKey)
                .Select(g =>
                {
                    var latest = g.OrderByDescending(r => r.StartedAt).First();
                    var failed = g.Any(r => r.Status == "Failed" && r.StartedAt == latest.StartedAt);
                    return new BackgroundJobDefinitionDto
                    {
                        Id = latest.JobKey,
                        Name = latest.JobName,
                        Queue = latest.Queue,
                        Status = failed ? "failed" : (latest.CompletedAt == null ? "running" : "idle"),
                        LastRun = latest.StartedAt,
                        NextRun = latest.CompletedAt?.AddHours(latest.Queue switch
                        {
                            "reports" => 24,
                            "inventory" => 1,
                            "loyalty" => 12,
                            "notifications" => 2,
                            _ => 168,
                        }),
                    };
                })
                .OrderBy(j => j.Name)
                .ToList();

            var history = runs
                .Where(r => r.StartedAt >= DateTime.UtcNow.AddHours(-24))
                .GroupBy(r => r.StartedAt.Hour)
                .OrderBy(g => g.Key)
                .Select(g => new BackgroundJobHistoryPointDto
                {
                    Time = $"{g.Key:D2}:00",
                    Completed = g.Count(r => r.Status == "Success"),
                    Failed = g.Count(r => r.Status == "Failed"),
                })
                .ToList();

            var total = runs.Count;
            var failedCount = runs.Count(r => r.Status == "Failed");

            return Ok(new BackgroundJobsDashboardDto
            {
                Jobs = jobDefs,
                History = history,
                TotalRuns = total,
                FailedRuns = failedCount,
                SuccessRate = total > 0 ? Math.Round((total - failedCount) * 100.0 / total, 1) : 100,
            });
        }
    }
}
