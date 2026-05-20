namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class InventoryStockLog
    {
        public int Id { get; set; }
        public int PartId { get; set; }
        public Part? Part { get; set; }
        public int QuantityChange { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string ReferenceType { get; set; } = string.Empty;
        public int? ReferenceId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
