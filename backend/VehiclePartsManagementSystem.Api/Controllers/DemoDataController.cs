using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Infrastructure.Data;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DemoDataController : ControllerBase
    {
        private readonly IDemoDataSeeder _seeder;
        private readonly AppDbContext _db;

        public DemoDataController(IDemoDataSeeder seeder, AppDbContext db)
        {
            _seeder = seeder;
            _db = db;
        }

        [HttpPost("seed")]
        [ProducesResponseType(typeof(DemoDataSeedResult), StatusCodes.Status200OK)]
        public async Task<ActionResult<DemoDataSeedResult>> Seed(
            [FromQuery] bool force = false,
            CancellationToken cancellationToken = default)
        {
            var result = await _seeder.SeedAsync(force, cancellationToken);
            return Ok(result);
        }

        [HttpGet("status")]
        public async Task<ActionResult<object>> Status(CancellationToken cancellationToken = default)
        {
            return Ok(new
            {
                Customers = await _db.Customers.CountAsync(cancellationToken),
                Parts = await _db.Parts.CountAsync(cancellationToken),
                Sales = await _db.Sales.CountAsync(cancellationToken),
                Purchases = await _db.PurchaseInvoices.CountAsync(cancellationToken),
                AuditLogs = await _db.AuditLogs.CountAsync(cancellationToken),
                BackgroundJobRuns = await _db.BackgroundJobRuns.CountAsync(cancellationToken),
                DemoReady = await _db.Sales.CountAsync(cancellationToken) >= 400,
            });
        }
    }
}
