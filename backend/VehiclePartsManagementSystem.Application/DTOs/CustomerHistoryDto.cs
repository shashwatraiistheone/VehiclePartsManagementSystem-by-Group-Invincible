namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CustomerHistoryDto
    {
        public int CustomerId { get; set; }
        public List<PurchaseHistoryDto> Purchases { get; set; } = new();
        public List<ServiceHistoryDto> Services { get; set; } = new();
    }

    public class PurchaseHistoryDto
    {
        public int SaleId { get; set; }
        public string Date { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal FinalAmount { get; set; }
        public List<PurchaseItemHistoryDto> Items { get; set; } = new();
    }

    public class PurchaseItemHistoryDto
    {
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }

    public class ServiceHistoryDto
    {
        public int AppointmentId { get; set; }
        public string ServiceType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
    }
}

