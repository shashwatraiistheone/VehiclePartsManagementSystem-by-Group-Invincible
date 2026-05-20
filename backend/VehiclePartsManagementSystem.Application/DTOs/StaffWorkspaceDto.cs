namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class StaffWorkspaceDto
    {
        public string Username { get; set; } = string.Empty;
        public string Account { get; set; } = string.Empty;
        public decimal SalesTodayRevenue { get; set; }
        public int SalesTodayCount { get; set; }
        public int SalesWeekCount { get; set; }
        public decimal SalesWeekRevenue { get; set; }
        public int CustomersServicedWeek { get; set; }
        public decimal RevenueThisMonth { get; set; }
        public int CustomersServicedMonth { get; set; }
        public int PendingAppointmentsCount { get; set; }
        public int PendingPartRequestsCount { get; set; }
        public int OverduePaymentsCount { get; set; }
        public decimal OverduePaymentsAmount { get; set; }
        public List<StaffWorkspaceAppointmentDto> TodayConfirmedAppointments { get; set; } = new();
        public List<StaffWorkspacePartRequestDto> PendingPartRequests { get; set; } = new();
        public List<StaffWorkspaceOverduePaymentDto> OverduePayments { get; set; } = new();
        public List<StaffWorkspaceSaleDto> RecentSales { get; set; } = new();
    }

    public class StaffWorkspaceAppointmentDto
    {
        public int Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string ServiceType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string? VehicleNumber { get; set; }
    }

    public class StaffWorkspacePartRequestDto
    {
        public int Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class StaffWorkspaceOverduePaymentDto
    {
        public int InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public decimal BalanceAmount { get; set; }
        public DateTime DueDate { get; set; }
        public int OverdueDays { get; set; }
    }

    public class StaffWorkspaceSaleDto
    {
        public int Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal FinalAmount { get; set; }
        public DateTime Date { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
    }
}
