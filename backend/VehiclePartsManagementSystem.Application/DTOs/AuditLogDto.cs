namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class AuditLogDto
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string Entity { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string PerformedBy { get; set; } = string.Empty;
    }
}
