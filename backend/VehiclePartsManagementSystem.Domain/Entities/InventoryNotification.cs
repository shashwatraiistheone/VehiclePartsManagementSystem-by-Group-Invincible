namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class InventoryNotification
    {
        public int Id { get; set; }
        public int PartId { get; set; }
        public Part? Part { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "Warning";
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
