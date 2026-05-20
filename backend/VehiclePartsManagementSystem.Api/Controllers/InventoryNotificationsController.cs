using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.DTOs;
using VehiclePartsManagementSystem.Application.Interfaces;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/inventory-notifications")]
    [Authorize(Roles = "Admin,Staff")]
    public class InventoryNotificationsController : ControllerBase
    {
        private readonly IInventoryNotificationService _service;

        public InventoryNotificationsController(IInventoryNotificationService service)
        {
            _service = service;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<InventoryNotificationDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<InventoryNotificationDto>>> Get(
            [FromQuery] int? limit,
            CancellationToken cancellationToken)
        {
            var rows = await _service.GetNotificationsAsync(limit, cancellationToken);
            return Ok(rows.ToList());
        }

        [HttpGet("unread-count")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<ActionResult<object>> UnreadCount(CancellationToken cancellationToken)
        {
            var count = await _service.GetUnreadCountAsync(cancellationToken);
            return Ok(new { count });
        }

        [HttpPost("sync")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> Sync(CancellationToken cancellationToken)
        {
            var created = await _service.SyncAlertsAsync(cancellationToken);
            return Ok(new { created });
        }

        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id, CancellationToken cancellationToken)
        {
            var ok = await _service.MarkAsReadAsync(id, cancellationToken);
            if (!ok) return NotFound(new { message = "Notification not found." });
            return Ok(new { message = "Notification marked as read." });
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
        {
            await _service.MarkAllAsReadAsync(cancellationToken);
            return Ok(new { message = "All notifications marked as read." });
        }
    }
}
