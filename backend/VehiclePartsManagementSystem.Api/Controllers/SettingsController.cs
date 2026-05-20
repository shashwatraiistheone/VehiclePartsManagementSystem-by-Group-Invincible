using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/settings")]
    public class SettingsController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public SettingsController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("company")]
        [Authorize(Roles = "Admin,Staff,Customer")]
        public IActionResult GetCompanySettings()
        {
            return Ok(new
            {
                name = _configuration["CompanySettings:Name"] ?? "Vehicle Management System",
                address = _configuration["CompanySettings:Address"] ?? "",
                phone = _configuration["CompanySettings:Phone"] ?? "",
                email = _configuration["CompanySettings:Email"] ?? "",
            });
        }
    }
}
