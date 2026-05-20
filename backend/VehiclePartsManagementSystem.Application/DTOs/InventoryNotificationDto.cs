namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class InventoryNotificationDto
    {
        public int Id { get; set; }
        public int PartId { get; set; }
        public string PartNumber { get; set; } = string.Empty;
        public string PartName { get; set; } = string.Empty;
        public int StockQuantity { get; set; }
        public int CriticalStockLevel { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
