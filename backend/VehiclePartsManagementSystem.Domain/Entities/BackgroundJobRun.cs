using System;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class BackgroundJobRun
    {
        public int Id { get; set; }
        public string JobKey { get; set; } = string.Empty;
        public string JobName { get; set; } = string.Empty;
        public string Queue { get; set; } = string.Empty;
        public string Status { get; set; } = "Success";
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public int? DurationMs { get; set; }
        public string? Message { get; set; }
    }
}
