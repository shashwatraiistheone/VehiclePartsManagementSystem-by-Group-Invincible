using System;

namespace VehiclePartsManagementSystem.Domain.Entities
{
    public class ServiceAppointment
    {
        public int Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public string ServiceType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string? VehicleNumber { get; set; }
        public string? Notes { get; set; }
        public decimal? EstimatedCost { get; set; }
    }
}

