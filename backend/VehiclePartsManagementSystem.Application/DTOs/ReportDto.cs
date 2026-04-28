namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class ReportDto
    {
        public int TotalCustomers { get; set; }
        public int TotalSales { get; set; }
        public decimal TotalRevenue { get; set; }
        public int LowStockPartsCount { get; set; }
    }
}
