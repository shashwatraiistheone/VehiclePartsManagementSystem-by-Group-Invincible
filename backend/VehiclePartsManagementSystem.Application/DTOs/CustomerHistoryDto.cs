namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CustomerHistoryDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public List<PurchaseHistoryDto> Purchases { get; set; } = new();
        public List<ServiceHistoryDto> Services { get; set; } = new();
    }

    public class PurchaseHistoryDto
    {
        public int SaleId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal FinalAmount { get; set; }
        public bool IsInvoiceSent { get; set; }
        public string? InvoiceSentDate { get; set; }
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
        public string? VehicleNumber { get; set; }
        public string Date { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? AssignedStaff { get; set; }
    }

    public class VehicleHistoryDto
    {
        public int Id { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public int Mileage { get; set; }
        public string? LastServiceDate { get; set; }
    }
}

