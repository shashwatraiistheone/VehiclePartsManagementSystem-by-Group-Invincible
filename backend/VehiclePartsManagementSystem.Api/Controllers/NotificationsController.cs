using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehiclePartsManagementSystem.Application.Interfaces;
using VehiclePartsManagementSystem.Domain.Entities;

namespace VehiclePartsManagementSystem.Api.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize(Roles = "Admin,Staff")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<Notification>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<Notification>>> GetNotifications(CancellationToken cancellationToken)
        {
            var notifications = await _notificationService.SyncAndGetNotificationsAsync(cancellationToken);
            return Ok(notifications.ToList());
        }

        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id, CancellationToken cancellationToken)
        {
            var ok = await _notificationService.MarkAsReadAsync(id, cancellationToken);
            if (!ok)
            {
                return NotFound(new { message = "Notification not found" });
            }

            return Ok(new { message = "Notification marked as read" });
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
        {
            await _notificationService.MarkAllAsReadAsync(cancellationToken);
            return Ok(new { message = "All notifications marked as read" });
        }
    }
}
