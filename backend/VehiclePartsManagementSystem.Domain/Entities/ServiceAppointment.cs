using System;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class ServiceAppointment
    {
        public int Id { get; set; }

        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public string ServiceType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
}

