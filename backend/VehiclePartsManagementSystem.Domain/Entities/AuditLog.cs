using System;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string Entity { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string PerformedBy { get; set; } = string.Empty;
    }
}
