namespace VehiclePartsManagementSystem.Application.DTOs
{
    public class StaffDashboardDto
    {
        public string Username { get; set; } = string.Empty;
        public string Account { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int TotalCustomers { get; set; }
        public int AppointmentsToday { get; set; }
        public int SalesToday { get; set; }
        public int PendingPartRequests { get; set; }
        public bool SystemOnline { get; set; } = true;
    }
}
