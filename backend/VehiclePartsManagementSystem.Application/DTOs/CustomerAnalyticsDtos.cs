namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class CustomerReportsDashboardDto
    {
        public int TotalCustomers { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal PendingCredit { get; set; }
        public int TotalSales { get; set; }
    }

    public class TopSpenderReportRowDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public decimal TotalSpent { get; set; }
        public int LoyaltyPoints { get; set; }
        public int PurchaseCount { get; set; }
        public DateTime? LastPurchaseDate { get; set; }
        public string LoyaltyTier { get; set; } = string.Empty;
    }

    public class RegularCustomerReportRowDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int PurchaseCount { get; set; }
        public int MonthlyVisits { get; set; }
        public decimal AverageOrderValue { get; set; }
        public string EngagementLevel { get; set; } = string.Empty;
        public string LoyaltyTier { get; set; } = string.Empty;
        public int EngagementScore { get; set; }
        public decimal TotalSpent { get; set; }
    }

    public class PendingCreditsReportDto
    {
        public decimal OutstandingTotal { get; set; }
        public List<PendingCreditReportRowDto> Items { get; set; } = new();
    }

    public class PendingCreditReportRowDto
    {
        public int InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public decimal OutstandingAmount { get; set; }
        public decimal OriginalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public int DaysOutstanding { get; set; }
        public int OverdueDays { get; set; }
        public string AgingBucket { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public DateTime SalesDate { get; set; }
        public DateTime InvoiceDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
