namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class ReportDto
    {
        public int TotalCustomers { get; set; }
        public int TotalSales { get; set; }
        public decimal TotalRevenue { get; set; }
        public int LowStockPartsCount { get; set; }
        public int PendingCreditsCount { get; set; }
        public decimal PendingCreditsAmount { get; set; }
        public int WeeklyPurchaseItemsCount { get; set; }
        public int WeeklyCustomerInteractions { get; set; }
        public decimal MonthlyPurchaseCost { get; set; }
    }
}
